// Re-run this any time the Polari word-list Google Sheet changes:
//   npm run seed:words
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings -> API in the Supabase dashboard).
// Safe to re-run: rows are upserted by slug, so edits/additions in the sheet sync without duplicating.

import { config } from 'dotenv';
import Papa from 'papaparse';

config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1XABOV0Z8QBzIyCBT4jGLr7B9V148X3lXlzbzcxPiX5o/export?format=csv';

type SheetRow = {
  'Word/Phrase': string;
  Type: string;
  'Part of Speech': string;
  Pronunciation: string;
  Definition: string;
  Origin: string;
  Example: string;
  'Notes/Variants': string;
};

function slugify(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '—' ? trimmed : null;
}

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet CSV: ${res.status}`);
  const csv = await res.text();

  const { data, errors } = Papa.parse<SheetRow>(csv, {
    header: true,
    skipEmptyLines: true,
    // The sheet's exported headers have stray leading/trailing spaces (e.g. " Type ")
    transformHeader: (h) => h.trim(),
  });
  if (errors.length) throw new Error(`CSV parse errors: ${JSON.stringify(errors)}`);

  // sort_order drives word-of-the-day rotation, so it must stay stable across re-runs even if
  // the sheet gets reordered or has rows inserted in the middle — only brand-new slugs get a
  // fresh sort_order, appended after the current max.
  const { data: existing, error: fetchError } = await supabase
    .from('words')
    .select('slug, sort_order');
  if (fetchError) throw fetchError;

  const existingSortOrderBySlug = new Map(existing.map((w) => [w.slug, w.sort_order]));
  let nextSortOrder = existing.reduce((max, w) => Math.max(max, w.sort_order), -1) + 1;

  const seenSlugs = new Set<string>();
  const rows = data
    .filter((row) => clean(row['Word/Phrase']) && clean(row.Definition))
    .map((row, index) => {
      const term = clean(row['Word/Phrase'])!;
      let slug = slugify(term);
      // Disambiguate rows that slugify to the same value (e.g. "Bevvy" variants)
      if (seenSlugs.has(slug)) slug = `${slug}-${index}`;
      seenSlugs.add(slug);

      const sortOrder = existingSortOrderBySlug.get(slug) ?? nextSortOrder++;

      return {
        sort_order: sortOrder,
        slug,
        term,
        entry_type: (clean(row.Type)?.toLowerCase() === 'phrase' ? 'phrase' : 'word') as
          | 'word'
          | 'phrase',
        part_of_speech: clean(row['Part of Speech']),
        pronunciation: clean(row.Pronunciation),
        definition: clean(row.Definition)!,
        origin: clean(row.Origin),
        example: clean(row.Example),
        notes_variants: clean(row['Notes/Variants']),
      };
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
