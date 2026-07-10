import type { Word } from '../types/database';

export const QUIZ_LENGTH = 10;
const OPTIONS_PER_QUESTION = 4;

// A round mixes three formats in a gentle difficulty ramp: recognise the
// definition, then recognise the term, then recall the term unprompted.
const MEANING_COUNT = 5;
const REVERSE_COUNT = 3;
// remainder of QUIZ_LENGTH becomes typed questions

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
      kind: 'typed'; // show the definition, type the term
      word: Word;
    };

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Case/punctuation-insensitive comparison for typed answers.
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Terms like "Vada/Varda" or "Barkey/Barkie/Barky" list variants — any one of
// them (or the whole string) counts as a correct typed answer.
export function isTypedAnswerCorrect(word: Word, answer: string): boolean {
  const given = normalise(answer);
  if (!given) return false;
  const variants = word.term
    .split(/[/,]/)
    .map(normalise)
    .filter(Boolean);
  return variants.includes(given) || normalise(word.term) === given;
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
  const distractors = shuffle(pool.filter((w) => w.id !== word.id && w.term !== word.term))
    .slice(0, OPTIONS_PER_QUESTION - 1)
    .map((w) => w.term);
  const options = shuffle([word.term, ...distractors]);
  return { kind: 'reverse', word, options, correctIndex: options.indexOf(word.term) };
}

// Builds a mixed round entirely from the cached word list. Distractors are real
// definitions/terms from other words, so options read plausibly. Words with
// duplicate definitions (e.g. two terms for "drink") are excluded from each
// other's option sets to avoid two "correct" answers appearing at once.
export function generateQuiz(words: Word[], length: number = QUIZ_LENGTH): QuizQuestion[] {
  const questionWords = shuffle(words).slice(0, Math.min(length, words.length));

  return questionWords.map((word, i) => {
    if (i < Math.min(MEANING_COUNT, questionWords.length)) return buildMeaning(word, words);
    if (i < Math.min(MEANING_COUNT + REVERSE_COUNT, questionWords.length))
      return buildReverse(word, words);
    return { kind: 'typed', word };
  });
}
