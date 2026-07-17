import type { Word } from '../types/database';
import { CHARACTER_SLUGS } from './characterArt';

export const QUIZ_LENGTH = 10;
const OPTIONS_PER_QUESTION = 4;
const MATCH_SIZE = 4; // words per matching board

// A round mixes formats — recognise the definition, recognise the term, name the
// character — and closes with a matching board.
export type QuizQuestion =
  | {
      kind: 'meaning'; // show the term, pick the definition
      word: Word;
      options: string[];
      correctIndex: number;
    }
  | {
      kind: 'reverse'; // show the definition, pick the term
      word: Word;
      options: string[];
      correctIndex: number;
    }
  | {
      kind: 'character'; // show the illustration, pick the word
      word: Word;
      options: string[];
      correctIndex: number;
    }
  | {
      kind: 'match'; // pair four words with their definitions
      words: Word[]; // display order (terms)
      defs: string[]; // shuffled definitions
    };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hasArt(word: Word): boolean {
  return CHARACTER_SLUGS.includes(word.slug);
}

function termOptions(word: Word, pool: Word[]): { options: string[]; correctIndex: number } {
  const distractors = shuffle(pool.filter((w) => w.id !== word.id && w.term !== word.term))
    .slice(0, OPTIONS_PER_QUESTION - 1)
    .map((w) => w.term);
  const options = shuffle([word.term, ...distractors]);
  return { options, correctIndex: options.indexOf(word.term) };
}

function buildMeaning(word: Word, pool: Word[]): QuizQuestion {
  const distractors = shuffle(
    pool.filter((w) => w.id !== word.id && w.definition !== word.definition)
  )
    .slice(0, OPTIONS_PER_QUESTION - 1)
    .map((w) => w.definition);
  const options = shuffle([word.definition, ...distractors]);
  return { kind: 'meaning', word, options, correctIndex: options.indexOf(word.definition) };
}

function buildReverse(word: Word, pool: Word[]): QuizQuestion {
  const { options, correctIndex } = termOptions(word, pool);
  return { kind: 'reverse', word, options, correctIndex };
}

function buildCharacter(word: Word, pool: Word[]): QuizQuestion | null {
  if (!hasArt(word)) return null;
  const { options, correctIndex } = termOptions(word, pool);
  return { kind: 'character', word, options, correctIndex };
}

// A match board scored every pair correctly (used for scoring).
// pairs[i] = index into q.defs the player assigned to word i.
export function isMatchComplete(
  q: Extract<QuizQuestion, { kind: 'match' }>,
  pairs: (number | null)[]
): boolean {
  return q.words.every((w, i) => pairs[i] !== null && q.defs[pairs[i] as number] === w.definition);
}

const SINGLE_FORMATS = ['meaning', 'reverse', 'character'] as const;

function buildSingle(fmt: (typeof SINGLE_FORMATS)[number], word: Word, pool: Word[]): QuizQuestion | null {
  switch (fmt) {
    case 'meaning':
      return buildMeaning(word, pool);
    case 'reverse':
      return buildReverse(word, pool);
    case 'character':
      return buildCharacter(word, pool);
  }
}

// Draw ONE question in a random format from a random unused word — the engine
// behind every mode, so questions and formats are always randomised. `used`
// tracks words already asked this game (mutated); `pickFrom` narrows which
// words get asked (e.g. the SRS due queue) while `pool` stays the distractor
// source. Returns null when no more questions can be built.
export function nextQuestion(
  pool: Word[],
  used: Set<string>,
  pickFrom?: Word[]
): QuizQuestion | null {
  const askable = (pickFrom && pickFrom.length > 0 ? pickFrom : pool).filter(
    (w) => !used.has(w.id)
  );
  if (askable.length === 0) return null;

  // Occasionally a matching board, when there's room for four fresh words.
  if (askable.length >= MATCH_SIZE + 1 && Math.random() < 0.18) {
    const picks: Word[] = [];
    const seenDefs = new Set<string>();
    for (const w of shuffle(askable)) {
      if (seenDefs.has(w.definition)) continue;
      seenDefs.add(w.definition);
      picks.push(w);
      if (picks.length === MATCH_SIZE) break;
    }
    if (picks.length === MATCH_SIZE) {
      picks.forEach((w) => used.add(w.id));
      return { kind: 'match', words: picks, defs: shuffle(picks.map((w) => w.definition)) };
    }
  }

  // Single-word: pick a random format, then the first unused word it fits.
  for (const fmt of shuffle([...SINGLE_FORMATS])) {
    for (const w of shuffle(askable)) {
      const q = buildSingle(fmt, w, pool);
      if (q) {
        used.add(w.id);
        return q;
      }
    }
  }
  return null;
}

// A fixed-length round (Mode 1 / review). Endless modes call nextQuestion
// directly as the player advances.
export function generateQuiz(
  words: Word[],
  length: number = QUIZ_LENGTH,
  from?: Word[]
): QuizQuestion[] {
  const used = new Set<string>();
  const screens: QuizQuestion[] = [];
  for (let i = 0; i < length; i++) {
    const q = nextQuestion(words, used, from);
    if (!q) break;
    screens.push(q);
  }
  return screens;
}
