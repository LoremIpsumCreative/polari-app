import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHighScore } from '../../../src/lib/quizScores';
import { colors, radii, spacing } from '../../../src/lib/theme';

export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ score?: string; total?: string }>();
  const score = Number(params.score ?? 0);
  const total = Number(params.total ?? 10);
  const { highScore, saveAttempt, signedIn } = useHighScore();

  // Snapshot the previous best before saving, so "New high score!" compares
  // against what stood when the round finished.
  const previousBest = useRef<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    previousBest.current = highScore;
    if (signedIn) {
      saveAttempt(score, total).then(() => setSaved(true));
    }
    // Save exactly once per results view; highScore in deps would re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const isNewHighScore =
    signedIn && saved && (previousBest.current === null || score > previousBest.current);

  const headline =
    score === total
      ? 'Fantabulosa! 🎉'
      : score >= total * 0.7
        ? 'Bona work! 👏'
        : score >= total * 0.4
          ? 'Not bad, ducky.'
          : 'Time to vada the dictionary…';

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.score}>
        {score}/{total}
      </Text>
      {isNewHighScore ? <Text style={styles.newBest}>🏆 New high score!</Text> : null}
      {!signedIn ? (
        <Pressable onPress={() => router.push('/sign-in')}>
          <Text style={styles.signInHint}>
            <Text style={styles.signInLink}>Sign in</Text> to save your score
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={() => router.replace('/quiz/play')}
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
    gap: spacing.sm,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
  },
  newBest: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  signInHint: {
    fontSize: 14,
    color: colors.textMuted,
  },
  signInLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  buttons: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
