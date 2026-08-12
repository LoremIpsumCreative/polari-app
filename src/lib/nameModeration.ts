// Display-name normalisation.
//
// The moderation dictionary stores clean terms — `fuck`, `jesus`, `admin` — and
// this turns whatever was typed into forms those terms can be matched against.
// That is the whole point of the design: there is no entry for `f*ck`, `f.u.c.k`
// or `FU¢K`, because the normaliser is what collapses those onto `fuck`.
//
// Three forms come out, and each catches a different kind of evasion:
//
//   original    exactly what was typed, kept for display and for logging
//   normalised  case, accents, leetspeak and separators settled, words intact —
//               the form whole-word rules match against
//   compact     all punctuation gone and runs collapsed — the form
//               compact_contains rules match against
//
// Two forms rather than one because the aggressive conversions are ambiguous:
// `!` and `|` become `i`, which is right for `f!ck` and wrong for a name that
// simply contains an exclamation mark. Keeping a gentler `normalised` alongside
// the ruthless `compact` lets a rule choose how much distortion it accepts,
// which is what keeps Cassie from being read as containing a slur.

/** Leetspeak and symbol substitutions applied to both output forms. */
const SUBSTITUTIONS: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '2': 'z',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '6': 'g',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  $: 's',
  '€': 'e',
  '£': 'l',
  '¢': 'c',
  '¥': 'y',
};

/** Applied to the compact form only — too ambiguous for whole-word matching. */
const AGGRESSIVE: Record<string, string> = {
  '!': 'i',
  '|': 'i',
  '+': 't',
};

// Latin lookalikes from other writing systems. Handled apart from accent
// stripping on purpose: removing a diacritic from a legitimate name is
// harmless, but rewriting every non-Latin script would mangle real names, so
// this is deliberately narrow — the characters actually used to spell English
// profanity while looking innocent.
const CONFUSABLES: Record<string, string> = {
  а: 'a', // Cyrillic
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  х: 'x',
  і: 'i',
  ѕ: 's',
  ԁ: 'd',
  ո: 'n', // Armenian
  ս: 'u',
  ց: 'g',
  α: 'a', // Greek
  ε: 'e',
  ο: 'o',
  ρ: 'p',
  τ: 't',
  υ: 'u',
};

/** Characters people use to break a word up so it slips past a word list. */
const SEPARATORS = /[._~*^|+\-,'"`•·]+/g;
/** Zero-width and other invisible characters. */
const INVISIBLE = /[​-‍⁠﻿­]/g;

export type NormalisedName = {
  original: string;
  normalised: string;
  compact: string;
};

export function normaliseDisplayName(input: string): NormalisedName {
  // NFKC first: it folds compatibility forms (ﬁ, ①, ｆｕｌｌｗｉｄｔｈ) onto their
  // plain equivalents before anything else looks at the string.
  let value = input.normalize('NFKC').toLocaleLowerCase('en-AU');

  // Decompose, drop the combining marks, recompose: strips accents without
  // touching the base letters.
  value = value.normalize('NFD').replace(/\p{M}/gu, '');

  value = value.replace(INVISIBLE, '');
  value = [...value].map((c) => CONFUSABLES[c] ?? c).join('');
  value = [...value].map((c) => SUBSTITUTIONS[c] ?? c).join('');

  const normalised = value.replace(SEPARATORS, ' ').replace(/\s+/g, ' ').trim();

  let compact = [...normalised]
    .map((c) => AGGRESSIVE[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]/g, '');
  // fuuuuuck → fuck. Three or more, so genuine doubles (Aaron, Lloyd) survive.
  compact = compact.replace(/(.)\1{2,}/g, '$1');

  return { original: input, normalised, compact };
}

// Format rules, checked before the dictionary is consulted. These are about
// shape rather than meaning, and they are the same on the client and the server.
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;

/**
 * Shape-only validation: length, character set, and the obvious spam vectors.
 * Returns a reason to show the reader, or null when the name is acceptable.
 *
 * Deliberately separate from the dictionary check — this half can run offline
 * and gives a specific message, because telling someone their name is too long
 * teaches them nothing about the moderation rules.
 */
export function checkDisplayNameFormat(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length < DISPLAY_NAME_MIN) return `Use at least ${DISPLAY_NAME_MIN} characters.`;
  if (trimmed.length > DISPLAY_NAME_MAX) return `Use ${DISPLAY_NAME_MAX} characters or fewer.`;
  // Letters (any script, so non-English names are welcome), digits, spaces and
  // a few joiners. Everything else — including the separators the normaliser
  // strips — is refused outright rather than silently rewritten.
  if (!/^[\p{L}\p{N} '\-_.]+$/u.test(trimmed)) {
    return 'Use letters, numbers, spaces, hyphens and apostrophes only.';
  }
  if (/(https?:\/\/|www\.|@)/i.test(trimmed))
    return 'Display names cannot contain links or addresses.';
  if (!/\p{L}/u.test(trimmed)) return 'Include at least one letter.';
  return null;
}

/** The one message the reader sees when the dictionary rejects a name. */
export const DISPLAY_NAME_REJECTED =
  'That display name isn’t available. Try another without offensive, political, religious or reserved terms.';
