import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  IconBook2,
  IconCrown,
  IconFlame,
  IconHeart,
  IconHearts,
  IconMasksTheater,
  IconMicrophone2,
  IconSparkles,
  IconStar,
  IconTargetArrow,
  IconTrophy,
  type IconProps,
} from '@tabler/icons-react-native';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { useStreaks } from './streaks';
import { useFavourites } from './favourites';
import { useProgress } from './progress';

// Achievements are derived, never stored: every badge is computed from state the
// app already tracks (streaks, favourites, quiz attempts, SRS mastery), so
// there's no second source of truth to drift. Streak badges key off the longest
// streak so a badge, once earned, can't be un-earned by a broken streak.

export type Achievement = {
  id: string;
  title: string;
  description: string;
  Icon: ComponentType<IconProps>;
  target: number;
  current: number;
  earned: boolean;
};

type QuizStats = { attempts: number; best: number; perfects: number };

export function useAchievements() {
  const { session } = useAuth();
  const { stats } = useStreaks();
  const { favouriteWordIds } = useFavourites();
  const { progress } = useProgress();
  const [quiz, setQuiz] = useState<QuizStats>({ attempts: 0, best: 0, perfects: 0 });

  useEffect(() => {
    if (!session) {
      setQuiz({ attempts: 0, best: 0, perfects: 0 });
      return;
    }
    let cancelled = false;
    supabase
      .from('quiz_attempts')
      .select('score, total_questions')
      .then(({ data }) => {
        if (cancelled || !data) return;
        setQuiz({
          attempts: data.length,
          best: data.reduce((m, a) => Math.max(m, a.score), 0),
          perfects: data.filter((a) => a.score === a.total_questions).length,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return useMemo(() => {
    const longestStreak = stats?.longest_streak ?? 0;
    const wordsLearned = stats?.words_learned_count ?? 0;
    const favs = favouriteWordIds.size;
    // "Known" = proven recall across repeated reviews, not a single lucky guess
    const known = [...progress.values()].filter((p) => p.mastery >= 3).length;

    const defs: Omit<Achievement, 'earned'>[] = [
      // Streaks
      {
        id: 'streak-3',
        title: 'Warming up',
        description: 'Keep a 3-day streak',
        Icon: IconFlame,
        target: 3,
        current: longestStreak,
      },
      {
        id: 'streak-7',
        title: 'Regular haunt',
        description: 'Keep a 7-day streak',
        Icon: IconFlame,
        target: 7,
        current: longestStreak,
      },
      {
        id: 'streak-30',
        title: 'Fixture on the scene',
        description: 'Keep a 30-day streak',
        Icon: IconCrown,
        target: 30,
        current: longestStreak,
      },
      // Words seen
      {
        id: 'words-25',
        title: 'Getting the lingo',
        description: 'Meet 25 words',
        Icon: IconBook2,
        target: 25,
        current: wordsLearned,
      },
      {
        id: 'words-100',
        title: 'Omi of letters',
        description: 'Meet 100 words',
        Icon: IconBook2,
        target: 100,
        current: wordsLearned,
      },
      // Favourites
      {
        id: 'fav-1',
        title: 'First crush',
        description: 'Save your first favourite',
        Icon: IconHeart,
        target: 1,
        current: favs,
      },
      {
        id: 'fav-10',
        title: 'Cabinet of curiosities',
        description: 'Save 10 favourites',
        Icon: IconHearts,
        target: 10,
        current: favs,
      },
      // Quiz
      {
        id: 'quiz-1',
        title: 'Opening night',
        description: 'Finish your first quiz',
        Icon: IconMicrophone2,
        target: 1,
        current: quiz.attempts,
      },
      {
        id: 'quiz-7',
        title: 'Sharp ear',
        description: 'Score 7 or better in a quiz',
        Icon: IconTargetArrow,
        target: 7,
        current: quiz.best,
      },
      {
        id: 'quiz-perfect',
        title: 'Fantabulosa!',
        description: 'Score a perfect round',
        Icon: IconStar,
        target: 1,
        current: quiz.perfects,
      },
      // Mastery (spaced repetition)
      {
        id: 'known-10',
        title: 'Ten in the bank',
        description: 'Master 10 words in review',
        Icon: IconSparkles,
        target: 10,
        current: known,
      },
      {
        id: 'known-50',
        title: 'Walking dictionary',
        description: 'Master 50 words in review',
        Icon: IconMasksTheater,
        target: 50,
        current: known,
      },
    ];

    const achievements: Achievement[] = defs.map((d) => ({
      ...d,
      current: Math.min(d.current, d.target),
      earned: d.current >= d.target,
    }));
    return {
      achievements,
      earnedCount: achievements.filter((a) => a.earned).length,
      signedIn: !!session,
    };
  }, [stats, favouriteWordIds, progress, quiz, session]);
}

// Re-exported so the collection summary can show a trophy without re-deriving
export { IconTrophy };
