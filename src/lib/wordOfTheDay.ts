import type { Word } from '../types/database';

// Fixed reference date for the daily rotation. NEVER change this after launch —
// it would shift every user's word of the day.
const EPOCH = { year: 2026, month: 7, day: 1 };

// Days between EPOCH and the given date, in the device's local calendar
// (deliberately local, Wordle-style: everyone's word changes at their own midnight).
export function daysSinceEpoch(date: Date): number {
  const epochUtc = Date.UTC(EPOCH.year, EPOCH.month - 1, EPOCH.day);
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((dateUtc - epochUtc) / 86_400_000);
}

export function wordOfTheDayIndex(date: Date, wordCount: number): number {
  if (wordCount <= 0) return 0;
  // ((n % m) + m) % m keeps the index positive even for dates before EPOCH.
  return ((daysSinceEpoch(date) % wordCount) + wordCount) % wordCount;
}

// words must be sorted by sort_order (WordsProvider guarantees this).
export function wordOfTheDay(words: Word[], date: Date = new Date()): Word | null {
  if (words.length === 0) return null;
  return words[wordOfTheDayIndex(date, words.length)];
}
