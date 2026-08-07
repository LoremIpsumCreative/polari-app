import IconClockHour4 from '@tabler/icons-react-native/IconClockHour4';
import IconHeart from '@tabler/icons-react-native/IconHeart';
import IconListNumbers from '@tabler/icons-react-native/IconListNumbers';
import type { IconProps } from './icons';
import type { ComponentType } from 'react';

// The three quiz game modes (per quiz-conditions_polari.csv). Modes dictate the
// round's length, timing, end condition and scoring — never the questions,
// which are always randomised in both word and format.
export type QuizModeId = 'ten' | 'timed' | 'life';

export type QuizMode = {
  id: QuizModeId;
  label: string; // fan + button label
  Icon: ComponentType<IconProps>;
  blurb: string; // one-line description
  timer: 'none' | 'countdown' | 'elapsed';
  countdownSeconds?: number; // for the 'timed' mode
  questionLimit?: number; // for the 'ten' mode
  end: 'questions' | 'time' | 'firstWrong';
  scoring: 'longestStreak' | 'totalCorrect' | 'consecutive';
  scoreLabel: string; // shown on the results screen
};

export const QUIZ_MODES: Record<QuizModeId, QuizMode> = {
  ten: {
    id: 'ten',
    label: "10 Q's",
    Icon: IconListNumbers,
    blurb: 'Answer 10 questions and build your longest streak over multiple games.',
    timer: 'none',
    questionLimit: 10,
    end: 'questions',
    scoring: 'longestStreak',
    scoreLabel: 'Longest streak',
  },
  timed: {
    id: 'timed',
    label: '1 Min',
    Icon: IconClockHour4,
    blurb: 'Score as many correct answers as possible in 60 seconds.',
    timer: 'countdown',
    countdownSeconds: 60,
    end: 'time',
    scoring: 'totalCorrect',
    scoreLabel: 'Correct answers',
  },
  life: {
    id: 'life',
    label: '1 Life',
    Icon: IconHeart,
    blurb: 'One wrong answer ends the game. How long can your streak last?',
    timer: 'elapsed',
    end: 'firstWrong',
    scoring: 'consecutive',
    scoreLabel: 'Correct in a row',
  },
};

// Fan order: left, top, right (matches the tab-bar satellite arc).
export const QUIZ_MODE_ORDER: QuizModeId[] = ['ten', 'timed', 'life'];

export function isQuizModeId(v: string | undefined): v is QuizModeId {
  return v === 'ten' || v === 'timed' || v === 'life';
}
