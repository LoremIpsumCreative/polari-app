import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useQuizStats } from '../../../src/lib/quizScores';
import { isQuizModeId } from '../../../src/lib/quizModes';
import { QuizResultBanner, type BannerVariant } from '../../../src/components/QuizResultBanner';
import { TAB_CONTENT_CLEARANCE } from '../../../src/components/AnimatedTabBar';
import { colors, fonts } from '../../../src/lib/theme';

const DESIGN_WIDTH = 394;

const ART: Record<BannerVariant, number> = {
  highScore: require('../../../assets/quiz/quizmaster-highscore.png'),
  timesUp: require('../../../assets/quiz/quizmaster-timesup.png'),
  results: require('../../../assets/quiz/quizmaster-results.png'),
};

const COPY: Record<BannerVariant, { title: string; label: string }> = {
  highScore: { title: 'High Score!', label: 'Your new high score is:' },
  timesUp: { title: 'Time’s Up!', label: 'Your score is:' },
  results: { title: 'Results', label: 'Your score is:' },
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scale = Math.min(width, 420) / DESIGN_WIDTH;

  const params = useLocalSearchParams<{
    mode?: string;
    score?: string;
    tenRun?: string;
    correct?: string;
    answered?: string;
  }>();
  const isReview = params.mode === 'review';
  const modeId = isQuizModeId(params.mode) ? params.mode : 'ten';
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

  // A high score needs a stored best to beat, so signed-out players never see it.
  const isNewBest =
    !isReview &&
    saved &&
    session != null &&
    (previousBest.current === null || score > previousBest.current);

  // "High Score!" wins for every mode; otherwise 1 Min gets "Time's Up!" and
  // 10 Q's / 1 Life (and review) fall back to "Results".
  const variant: BannerVariant = isNewBest
    ? 'highScore'
    : !isReview && modeId === 'timed'
      ? 'timesUp'
      : 'results';
  const { title, label } = COPY[variant];

  return (
    <View style={styles.container}>
      <QuizResultBanner variant={variant} title={title} />

      <Text style={[styles.label, { fontSize: 10 * scale, marginTop: 18 * scale }]}>
        {isReview ? `You reviewed ${correct}/${answered} — due words updated` : label}
      </Text>

      <View
        style={[
          styles.scorePill,
          { width: 229 * scale, height: 48 * scale, borderRadius: 12 * scale, marginTop: 6 * scale },
        ]}
      >
        <Text style={[styles.scoreText, { fontSize: 20 * scale }]}>{score}</Text>
      </View>

      <Image
        source={ART[variant]}
        resizeMode="contain"
        style={styles.art}
        accessibilityIgnoresInvertColors
      />

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.finish,
            { width: 149 * scale, height: 38 * scale },
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/quiz')}
        >
          <Text style={[styles.buttonText, { fontSize: 14 * scale }]}>Finish</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.playAgain,
            { width: 149 * scale, height: 38 * scale },
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace(`/quiz/play?mode=${isReview ? 'review' : modeId}`)}
        >
          <Text style={[styles.buttonText, { fontSize: 14 * scale }]}>Play Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  label: { fontFamily: fonts.bold, color: colors.text, letterSpacing: 0.3 },
  scorePill: {
    backgroundColor: colors.progressTrack,
    borderWidth: 1,
    borderColor: '#B3B9C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontFamily: fonts.bold, color: colors.ink },
  art: { flex: 1, width: '100%', marginTop: 8 },
  // Keep the buttons (and the art above them) clear of the tab bar's bubble.
  buttons: { flexDirection: 'row', gap: 18, justifyContent: 'center', marginBottom: TAB_CONTENT_CLEARANCE },
  button: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  finish: { backgroundColor: colors.primary },
  playAgain: { backgroundColor: '#388BFF' },
  buttonText: { color: colors.onPrimary, fontFamily: fonts.bold, letterSpacing: 0.3 },
  pressed: { opacity: 0.8 },
});
