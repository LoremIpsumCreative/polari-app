import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

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
    [userId, refresh]
  );

  return { highScore, saveAttempt, signedIn: !!userId };
}
