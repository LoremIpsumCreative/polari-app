import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

// Per-word spaced-repetition state, a simplified SM-2:
// - correct: mastery climbs (max 5), interval grows 1d -> 3d -> interval*ease
// - wrong: a lapse; mastery drops, the word is due again immediately, ease dips
// Reviews come from quiz answers, so practising IS reviewing.

export type WordProgress = {
  word_id: string;
  mastery: number;
  ease: number;
  reps: number;
  lapses: number;
  interval_days: number;
  due_at: string | null;
};

type ProgressContextValue = {
  // word_id -> progress (signed-in only; empty map when signed out)
  progress: Map<string, WordProgress>;
  dueWordIds: string[];
  recordAnswer: (wordId: string, correct: boolean) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function applyReview(
  prev: Pick<WordProgress, 'mastery' | 'ease' | 'reps' | 'lapses' | 'interval_days'>,
  correct: boolean,
): Omit<WordProgress, 'word_id'> {
  if (!correct) {
    return {
      mastery: Math.max(0, prev.mastery - 2),
      ease: Math.max(1.3, prev.ease - 0.2),
      reps: prev.reps + 1,
      lapses: prev.lapses + 1,
      interval_days: 0,
      due_at: new Date().toISOString(), // due again this session/day
    };
  }
  const reps = prev.reps + 1;
  const intervalDays =
    prev.interval_days <= 0
      ? 1
      : prev.interval_days === 1
        ? 3
        : Math.round(prev.interval_days * prev.ease);
  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  return {
    mastery: Math.min(5, prev.mastery + 1),
    ease: Math.min(2.8, prev.ease + 0.05),
    reps,
    lapses: prev.lapses,
    interval_days: intervalDays,
    due_at: due.toISOString(),
  };
}

const FRESH = { mastery: 0, ease: 2.5, reps: 0, lapses: 0, interval_days: 0 };

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [progress, setProgress] = useState<Map<string, WordProgress>>(new Map());

  useEffect(() => {
    if (!userId) {
      setProgress(new Map());
      return;
    }
    let cancelled = false;
    supabase
      .from('user_word_progress')
      .select('word_id, mastery, ease, reps, lapses, interval_days, due_at')
      .then(({ data }) => {
        if (!cancelled && data) {
          setProgress(new Map(data.map((row) => [row.word_id, row as WordProgress])));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const recordAnswer = useCallback(
    (wordId: string, correct: boolean) => {
      if (!userId) return; // guests still play; nothing is tracked
      setProgress((prev) => {
        const current = prev.get(wordId) ?? { word_id: wordId, ...FRESH, due_at: null };
        const next = { word_id: wordId, ...applyReview(current, correct) };
        // Optimistic local update; fire-and-forget upsert (RLS scopes to owner).
        supabase
          .from('user_word_progress')
          .upsert(
            { user_id: userId, ...next, last_reviewed_at: new Date().toISOString() },
            { onConflict: 'user_id,word_id' },
          )
          .then(({ error }) => {
            if (error) console.warn('progress save failed', error.message);
          });
        const copy = new Map(prev);
        copy.set(wordId, next);
        return copy;
      });
    },
    [userId],
  );

  const dueWordIds = useMemo(() => {
    const now = Date.now();
    return [...progress.values()]
      .filter((p) => p.due_at !== null && Date.parse(p.due_at) <= now)
      .sort((a, b) => Date.parse(a.due_at!) - Date.parse(b.due_at!))
      .map((p) => p.word_id);
  }, [progress]);

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, dueWordIds, recordAnswer }),
    [progress, dueWordIds, recordAnswer],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
