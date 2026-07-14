import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useQuizStats } from '../../../src/lib/quizScores';
import { QUIZ_MODES, isQuizModeId } from '../../../src/lib/quizModes';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    score?: string;
    tenRun?: string;
    correct?: string;
    answered?: string;
  }>();
  const isReview = params.mode === 'review';
  const modeId = isQuizModeId(params.mode) ? params.mode : 'ten';
  const mode = QUIZ_MODES[modeId];
  const score = Number(params.score ?? 0);
  const tenRun = Number(params.tenRun ?? 0);
  const correct = Number(params.correct ?? 0);
  const answered = Number(params.answered ?? 0);

  const { session } = useAuth();
  const { recordGame, bestFor } = useQuizStats();

  const previousBest = useRef<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved || isReview) return;
    previousBest.current = bestFor(modeId);
    if (session) {
      recordGame(modeId, score, tenRun);
      // Keep the achievement counters (attempts / best / perfect) fed.
      supabase
        .from('quiz_attempts')
        .insert({ user_id: session.user.id, score: correct, total_questions: answered || 1 });
      setSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isReview]);

  const isNewBest =
    !isReview && saved && session != null && (previousBest.current === null || score > previousBest.current);

  const headline =
    score >= 10
      ? 'Fantabulosa! 🎉'
      : score >= 6
        ? 'Bona work! 👏'
        : score >= 3
          ? 'Not bad, ducky.'
          : 'Time to vada the dictionary…';

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>{isReview ? 'Review done 👏' : headline}</Text>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.scoreLabel}>{isReview ? 'reviewed' : mode.scoreLabel}</Text>

      {isReview ? (
        <Text style={styles.sub}>
          {correct}/{answered} correct — your due words are updated.
        </Text>
      ) : isNewBest ? (
        <Text style={styles.newBest}>🏆 New high score!</Text>
      ) : session ? (
        <Text style={styles.sub}>High score: {Math.max(bestFor(modeId), score)}</Text>
      ) : (
        <Pressable onPress={() => router.push('/sign-in')}>
          <Text style={styles.sub}>
            <Text style={styles.link}>Sign in</Text> to save your score
          </Text>
        </Pressable>
      )}

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.replace(`/quiz/play?mode=${isReview ? 'review' : modeId}`)}
        >
          <Text style={styles.primaryText}>Play again</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={() => router.replace('/quiz')}
        >
          <Text style={styles.secondaryText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  headline: { fontSize: 26, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  score: { fontSize: 64, fontFamily: fonts.extrabold, color: colors.primary, marginTop: spacing.sm },
  scoreLabel: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sub: { marginTop: spacing.sm, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  link: { color: colors.primary, fontFamily: fonts.semibold },
  newBest: { marginTop: spacing.sm, fontSize: 16, fontFamily: fonts.bold, color: colors.accent },
  buttons: { marginTop: spacing.xl, gap: spacing.sm, alignSelf: 'stretch' },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  secondaryButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold },
  pressed: { opacity: 0.8 },
});
