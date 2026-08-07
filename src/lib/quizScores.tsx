import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { QuizModeId } from './quizModes';

export type QuizStats = {
  ten_run_current: number;
  ten_run_best: number;
  timed_best: number;
  life_best: number;
};

const EMPTY_STATS: QuizStats = { ten_run_current: 0, ten_run_best: 0, timed_best: 0, life_best: 0 };

// Per-mode quiz scoring. Mode 1's run persists server-side so it spans games;
// bests are the high scores shown per mode.
export function useQuizStats() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [stats, setStats] = useState<QuizStats>(EMPTY_STATS);
  // Stats start at zero and arrive asynchronously. Anything comparing a fresh
  // score against a stored best has to wait, or it compares against 0 and
  // reads every game as a new record.
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStats(EMPTY_STATS);
      setReady(true);
      return;
    }
    const { data } = await supabase
      .from('quiz_stats')
      .select('ten_run_current, ten_run_best, timed_best, life_best')
      .eq('user_id', userId)
      .maybeSingle();
    setStats(data ?? EMPTY_STATS);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Persist a finished game. `tenRun` is Mode 1's final consecutive run to carry
  // forward. Returns the updated stats (or null when signed out).
  const recordGame = useCallback(
    async (mode: QuizModeId, score: number, tenRun = 0): Promise<QuizStats | null> => {
      if (!userId) return null;
      const { data } = await supabase.rpc('record_quiz_game', {
        p_mode: mode,
        p_score: score,
        p_ten_run: tenRun,
      });
      const next = (data as QuizStats) ?? EMPTY_STATS;
      setStats(next);
      return next;
    },
    [userId],
  );

  const bestFor = (mode: QuizModeId) =>
    mode === 'ten' ? stats.ten_run_best : mode === 'timed' ? stats.timed_best : stats.life_best;

  return { stats, ready, recordGame, bestFor, signedIn: !!userId };
}

// Best score is derived from quiz_attempts (max score), never stored separately.
export function useHighScore() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [highScore, setHighScore] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setHighScore(null);
      return;
    }
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('score')
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) {
      setHighScore(data?.score ?? null);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveAttempt = useCallback(
    async (score: number, totalQuestions: number) => {
      if (!userId) return;
      await supabase
        .from('quiz_attempts')
        .insert({ user_id: userId, score, total_questions: totalQuestions });
      await refresh();
    },
    [userId, refresh],
  );

  return { highScore, saveAttempt, signedIn: !!userId };
}
