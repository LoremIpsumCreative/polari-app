// Upload the pending dictionary batch to Supabase.
//
//   npm run words:apply
//
// This is the ONLY step that writes to the database. It:
//   1. Fetches the live sheet.
//   2. Upserts every word by slug (new + edited rows), preserving sort_order.
//   3. Deletes words that were removed from the sheet (per your setup choice).
//   4. Advances scripts/words-snapshot.json to match, and rewrites
//      dictionary-changes.md to an "applied" state so the batch resets.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import {
  fetchSheetWords,
  readSnapshot,
  writeSnapshot,
  diffWords,
  CHANGES_PATH,
  type WordMap,
} from './lib/dictionary';

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { words: current, culturalFields } = await fetchSheetWords();
  const snapshot = readSnapshot() ?? ({} as WordMap);
  const diff = diffWords(snapshot, current, culturalFields);

  if (!diff.hasChanges) {
    console.log('No pending changes — nothing to apply.');
    return;
  }

  console.log(
    `Applying: ${diff.added.length} added, ${diff.updated.length} updated, ${diff.removed.length} removed…`
  );

  // sort_order drives word-of-the-day rotation, so keep it stable across runs:
  // reuse existing slugs' order and only append fresh order for brand-new slugs.
  const { data: existing, error: fetchError } = await supabase
    .from('words')
    .select('slug, sort_order');
  if (fetchError) throw fetchError;

  const existingSortOrderBySlug = new Map(existing.map((w) => [w.slug, w.sort_order]));
  let nextSortOrder = existing.reduce((max, w) => Math.max(max, w.sort_order), -1) + 1;

  const rows = Object.entries(current).map(([slug, c]) => {
    const row: Record<string, unknown> = {
      slug,
      sort_order: existingSortOrderBySlug.get(slug) ?? nextSortOrder++,
      term: c.term,
      entry_type: c.entry_type,
      part_of_speech: c.part_of_speech,
      pronunciation: c.pronunciation,
      definition: c.definition,
      origin: c.origin,
      example: c.example,
      notes_variants: c.notes_variants,
    };
    // Cultural fields ride along only when their sheet column exists, so absent
    // columns never blank out DB-seeded drafts.
    for (const f of culturalFields) {
      if (f === 'related_slugs') {
        row.related_slugs = c.related_slugs ? c.related_slugs.split(',') : null;
      } else {
        row[f] = c[f] ?? null;
      }
    }
    return row;
  });

  const { error: upsertError } = await supabase.from('words').upsert(rows, { onConflict: 'slug' });
  if (upsertError) throw upsertError;

  // Deletions: remove words that dropped out of the sheet (favourites cascade).
  const removedSlugs = diff.removed.map((r) => r.slug);
  if (removedSlugs.length) {
    const { error: deleteError } = await supabase.from('words').delete().in('slug', removedSlugs);
    if (deleteError) throw deleteError;
    console.log(`Deleted ${removedSlugs.length} removed word(s): ${removedSlugs.join(', ')}`);
  }

  // Advance the snapshot and reset the changes file now that the DB matches.
  writeSnapshot(current);
  const applied = new Date().toISOString();
  writeFileSync(
    CHANGES_PATH,
    [
      '# Dictionary changes — pending upload',
      '',
      `_Last applied ${applied}: ${diff.added.length} added, ${diff.updated.length} updated, ${diff.removed.length} removed._`,
      '',
      '**No pending changes. ✅** Edit the sheet, then run `npm run words:check`.',
      '',
    ].join('\n')
  );

  console.log(`Done. ${rows.length} words are live and the snapshot is up to date.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
