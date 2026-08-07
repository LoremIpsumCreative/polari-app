import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

export type StreakStats = {
  current_streak: number;
  longest_streak: number;
  words_learned_count: number;
  streak_freezes: number;
};

// Streak lengths worth celebrating with a banner on the Today screen
const MILESTONES = new Set([3, 7, 30, 100]);

type StreaksContextValue = {
  stats: StreakStats | null;
  // Credits today's engagement (idempotent server-side). Called when a signed-in
  // user views the Today screen.
  recordEngagement: () => Promise<void>;
  // A just-reached streak milestone (3/7/30/100), until dismissed
  celebration: number | null;
  dismissCelebration: () => void;
};

const StreaksContext = createContext<StreaksContextValue | null>(null);

export function StreaksProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [celebration, setCelebration] = useState<number | null>(null);
  // Client-side guard so a re-render doesn't spam the RPC; the server no-ops
  // on repeat calls within a day regardless.
  const lastRecordedDate = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      lastRecordedDate.current = null;
      return;
    }
    let cancelled = false;
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, words_learned_count, streak_freezes')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setStats(data);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const recordEngagement = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toDateString();
    if (lastRecordedDate.current === today) return;
    lastRecordedDate.current = today;

    const { data, error } = await supabase.rpc('record_daily_engagement');
    if (!error && data && data.length > 0) {
      const next = data[0];
      // Celebrate only a genuine increment we can see (prev loaded and smaller),
      // so reopening the app on a milestone day doesn't re-trigger the banner.
      setStats((prev) => {
        if (
          prev &&
          next.current_streak > prev.current_streak &&
          MILESTONES.has(next.current_streak)
        ) {
          setCelebration(next.current_streak);
        }
        return next;
      });
    } else if (error) {
      // Let a later view retry (e.g. transient network failure)
      lastRecordedDate.current = null;
    }
  }, [userId]);

  const value = useMemo<StreaksContextValue>(
    () => ({
      stats,
      recordEngagement,
      celebration,
      dismissCelebration: () => setCelebration(null),
    }),
    [stats, recordEngagement, celebration],
  );

  return <StreaksContext.Provider value={value}>{children}</StreaksContext.Provider>;
}

export function useStreaks(): StreaksContextValue {
  const ctx = useContext(StreaksContext);
  if (!ctx) throw new Error('useStreaks must be used within a StreaksProvider');
  return ctx;
}
