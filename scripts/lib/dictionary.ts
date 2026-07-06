// Shared helpers for the Polari dictionary sync tooling (seed / check / apply).
// Keeping the fetch + slug + normalise logic in one place guarantees the change
// checker, the applier, and the seeder all agree on how a sheet row maps to a
// word, so a diff can never disagree with what actually gets written.

import Papa from 'papaparse';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1XABOV0Z8QBzIyCBT4jGLr7B9V148X3lXlzbzcxPiX5o/export?format=csv';

const HERE = dirname(fileURLToPath(import.meta.url));
// scripts/words-snapshot.json — the "last applied" state, committed to git so the
// scheduled GitHub Action can diff against it without touching the database.
export const SNAPSHOT_PATH = join(HERE, '..', 'words-snapshot.json');
// dictionary-changes.md — the human-readable batch of pending changes, at repo root.
export const CHANGES_PATH = join(HERE, '..', '..', 'dictionary-changes.md');

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

// The content fields a diff cares about — everything a person edits in the sheet.
// (sort_order, id and created_at are DB bookkeeping and are intentionally excluded.)
export const CONTENT_FIELDS = [
  'term',
  'entry_type',
  'part_of_speech',
  'pronunciation',
  'definition',
  'origin',
  'example',
  'notes_variants',
] as const;

export type ContentField = (typeof CONTENT_FIELDS)[number];
export type WordContent = {
  term: string;
  entry_type: 'word' | 'phrase';
  part_of_speech: string | null;
  pronunciation: string | null;
  definition: string;
  origin: string | null;
  example: string | null;
  notes_variants: string | null;
};
/** slug -> content, the canonical shape used everywhere. */
export type WordMap = Record<string, WordContent>;

export function slugify(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '—' ? trimmed : null;
}

/**
 * Fetch the published Google Sheet as CSV and normalise it into a slug-keyed map
 * of word content. Slug disambiguation matches seed-words.ts exactly so the three
 * tools stay in lockstep.
 */
export async function fetchSheetWords(): Promise<WordMap> {
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

  const seenSlugs = new Set<string>();
  const map: WordMap = {};

  data
    .filter((row) => clean(row['Word/Phrase']) && clean(row.Definition))
    .forEach((row, index) => {
      const term = clean(row['Word/Phrase'])!;
      let slug = slugify(term);
      // Disambiguate rows that slugify to the same value (e.g. "Bevvy" variants)
      if (seenSlugs.has(slug)) slug = `${slug}-${index}`;
      seenSlugs.add(slug);

      map[slug] = {
        term,
        entry_type: clean(row.Type)?.toLowerCase() === 'phrase' ? 'phrase' : 'word',
        part_of_speech: clean(row['Part of Speech']),
        pronunciation: clean(row.Pronunciation),
        definition: clean(row.Definition)!,
        origin: clean(row.Origin),
        example: clean(row.Example),
        notes_variants: clean(row['Notes/Variants']),
      };
    });

  return map;
}

export function readSnapshot(): WordMap | null {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as WordMap;
}

export function writeSnapshot(map: WordMap): void {
  // Sort keys so the committed snapshot has a stable, review-friendly diff.
  const sorted: WordMap = {};
  for (const slug of Object.keys(map).sort()) sorted[slug] = map[slug];
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(sorted, null, 2) + '\n');
}

export type FieldChange = { field: ContentField; from: string | null; to: string | null };
export type Diff = {
  added: { slug: string; content: WordContent }[];
  updated: { slug: string; content: WordContent; changes: FieldChange[] }[];
  removed: { slug: string; content: WordContent }[];
  hasChanges: boolean;
};

/** Compare the last-applied snapshot (old) against the live sheet (current). */
export function diffWords(oldMap: WordMap, current: WordMap): Diff {
  const added: Diff['added'] = [];
  const updated: Diff['updated'] = [];
  const removed: Diff['removed'] = [];

  for (const slug of Object.keys(current).sort()) {
    const now = current[slug];
    const before = oldMap[slug];
    if (!before) {
      added.push({ slug, content: now });
      continue;
    }
    const changes: FieldChange[] = [];
    for (const field of CONTENT_FIELDS) {
      if ((before[field] ?? null) !== (now[field] ?? null)) {
        changes.push({ field, from: before[field] ?? null, to: now[field] ?? null });
      }
    }
    if (changes.length) updated.push({ slug, content: now, changes });
  }

  for (const slug of Object.keys(oldMap).sort()) {
    if (!current[slug]) removed.push({ slug, content: oldMap[slug] });
  }

  return { added, updated, removed, hasChanges: !!(added.length || updated.length || removed.length) };
}
