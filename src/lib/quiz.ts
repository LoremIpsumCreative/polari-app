import type { Word } from '../types/database';

export const QUIZ_LENGTH = 10;
const OPTIONS_PER_QUESTION = 4;

export type QuizQuestion = {
  word: Word;
  // definitions, one correct + three distractors, pre-shuffled
  options: string[];
  correctIndex: number;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Builds a round of multiple-choice questions entirely from the cached word list.
// Distractors are real definitions from other words, so options read plausibly.
// Words with duplicate definitions (e.g. two terms for "drink") are excluded from
// each other's option sets to avoid two "correct" answers appearing at once.
export function generateQuiz(words: Word[], length: number = QUIZ_LENGTH): QuizQuestion[] {
  const questionWords = shuffle(words).slice(0, Math.min(length, words.length));

  return questionWords.map((word) => {
    const distractors = shuffle(
      words.filter((w) => w.id !== word.id && w.definition !== word.definition)
    )
      .slice(0, OPTIONS_PER_QUESTION - 1)
      .map((w) => w.definition);

    const options = shuffle([word.definition, ...distractors]);
    return {
      word,
      options,
      correctIndex: options.indexOf(word.definition),
    };
  });
}
