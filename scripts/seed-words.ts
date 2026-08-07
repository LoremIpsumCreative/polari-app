// Full seed of the Polari word list from the Google Sheet.
//   npm run seed:words
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings -> API in the Supabase dashboard).
//
// This upserts every row by slug (safe to re-run). For incremental, reviewable
// updates prefer `npm run words:check` + `npm run words:apply`, which also record
// a change log and handle deletions. This seeder never deletes.

import { adminClient } from './lib/supabase';
import { fetchSheetWords } from './lib/dictionary';

async function main() {
  const supabase = adminClient();

  const { words: current, culturalFields } = await fetchSheetWords();

  // sort_order drives word-of-the-day rotation, so it must stay stable across re-runs even if
  // the sheet gets reordered or has rows inserted in the middle — only brand-new slugs get a
  // fresh sort_order, appended after the current max.
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
    // Cultural fields ride along only when their sheet column exists (see
    // scripts/lib/dictionary.ts), so absent columns never blank out DB drafts.
    for (const f of culturalFields) {
      if (f === 'related_slugs') {
        row.related_slugs = c.related_slugs ? c.related_slugs.split(',') : null;
      } else {
        row[f] = c[f] ?? null;
      }
    }
    return row;
  });

  console.log(`Parsed ${rows.length} words, upserting...`);

  const { error } = await supabase.from('words').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;

  console.log(`Done. ${rows.length} words are up to date.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
