import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useWords } from '../../../src/lib/words';
import { useHighScore } from '../../../src/lib/quizScores';
import { QUIZ_LENGTH } from '../../../src/lib/quiz';
import { LoungeDiva } from '../../../src/components/illustrations/LoungeDiva';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { highScore, signedIn } = useHighScore();

  return (
    <View style={styles.container}>
      <LoungeDiva width={210} />
      <Text style={styles.title}>How bona is your Polari?</Text>
      <Text style={styles.body}>
        {QUIZ_LENGTH} questions. Pick the right meaning for each word.
      </Text>

      {signedIn && highScore !== null ? (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your best</Text>
          <Text style={styles.scoreValue}>
            {highScore}/{QUIZ_LENGTH}
          </Text>
        </View>
      ) : null}
      {!signedIn ? (
        <Text style={styles.hint}>Sign in to save your high score.</Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.startButton, pressed && styles.startPressed]}
        onPress={() => router.push('/quiz/play')}
        disabled={loading || words.length < 4}
      >
        <Text style={styles.startText}>{loading ? 'Loading…' : 'Start quiz'}</Text>
      </Pressable>
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
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  scoreCard: {
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  hint: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  startButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
  startPressed: {
    opacity: 0.8,
  },
  startText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: fonts.bold,
  },
});
