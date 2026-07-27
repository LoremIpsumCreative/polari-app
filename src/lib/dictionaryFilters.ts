import type { Word } from '../types/database';

// The Dictionary's filter set, shared by the quick-filter chips in the search
// bar and the full filter modal (Figma 1889:1832) so the two can never drift.
export type DictionaryFilters = {
  words: boolean;
  phrases: boolean;
  favourites: boolean;
  partOfSpeech: string[];
  modernUsage: string[];
  origin: string[];
  hasArtwork: boolean;
};

export const EMPTY_FILTERS: DictionaryFilters = {
  words: false,
  phrases: false,
  favourites: false,
  partOfSpeech: [],
  modernUsage: [],
  origin: [],
  hasArtwork: false,
};

// Fixed by the design rather than derived, so the three read in severity order
// instead of however the data happens to sort.
export const MODERN_USAGE_OPTIONS = ['Common', 'Rare', 'Historical'];

// Origin ships disabled alongside Theme. The frame names eight clean origins,
// but the `origin` column holds prose ("Disputed; popular 'Not Available For
// Fucking' backronym…"), so there is nothing to match against without
// inventing a classification the design never specified.
export const ORIGIN_OPTIONS = [
  'Italian',
  'Sabir',
  'Romani',
  'Cockney Slang',
  'French',
  'English Slang',
  'Back Slang',
  'Yiddish',
];

// Theme ships disabled: the frame specifies these thirteen, but `words` has no
// column behind them. The section renders so the modal matches the mockup, and
// lights up once the data exists.
export const THEME_OPTIONS = [
  'People & Identities',
  'Body & Appearance',
  'Places & Travel',
  'Money & Numbers',
  'Sex & Relationships',
  'Actions & Behaviour',
  'Feelings & Descriptions',
  'Clothing & Objects',
  'Food & Drink',
  'Greetings & Expressions',
  'Theatre & Entertainment',
  'Crime, Law & Authority',
  'Insults & Profanity',
];

export function countActiveFilters(f: DictionaryFilters): number {
  return (
    (f.words ? 1 : 0) +
    (f.phrases ? 1 : 0) +
    (f.favourites ? 1 : 0) +
    f.partOfSpeech.length +
    f.modernUsage.length +
    f.origin.length +
    (f.hasArtwork ? 1 : 0)
  );
}

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// A word's parts of speech. The column stores compound values — "Noun,
// Adjective", "Noun (Plural)" — where the frame wants single tags, so split on
// the comma and drop the parenthetical qualifier.
export function partsOfSpeech(word: Word): string[] {
  return (word.part_of_speech ?? '')
    .split(',')
    .map((p) => p.replace(/\(.*?\)/g, '').trim())
    .filter(Boolean);
}

// Distinct parts of speech across the corpus, so the modal offers exactly what
// is actually tagged rather than a hardcoded list.
export function partOfSpeechOptions(words: Word[]): string[] {
  const seen = new Set<string>();
  for (const w of words) for (const p of partsOfSpeech(w)) seen.add(p);
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export function matchesFilters(
  word: Word,
  f: DictionaryFilters,
  ctx: { isFavourite: (id: string) => boolean; hasArtwork: (slug: string) => boolean }
): boolean {
  // Words and Phrases are additive: neither selected means no type filter,
  // both selected is the same as neither.
  if (f.words !== f.phrases) {
    const wanted = f.words ? 'word' : 'phrase';
    if (word.entry_type !== wanted) return false;
  }
  if (f.favourites && !ctx.isFavourite(word.id)) return false;
  if (f.partOfSpeech.length) {
    const tags = partsOfSpeech(word);
    if (!f.partOfSpeech.some((p) => tags.includes(p))) return false;
  }
  if (f.modernUsage.length && !f.modernUsage.includes(word.usage_status ?? '')) return false;
  if (f.origin.length && !f.origin.includes(word.origin ?? '')) return false;
  if (f.hasArtwork && !ctx.hasArtwork(word.slug)) return false;
  return true;
}
