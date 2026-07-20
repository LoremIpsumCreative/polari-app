import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import {
  BUBBLE_HIGH,
  BUBBLE_NORM,
  BUBBLE_TIME,
  BURST_HIGH,
  BURST_NORM,
  BURST_TIME,
  TITLE_HIGH,
  TITLE_NORM,
  TITLE_TIME,
} from '../../../src/components/resultsArt';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useQuizStats } from '../../../src/lib/quizScores';
import { isQuizModeId } from '../../../src/lib/quizModes';
import { colors, fonts } from '../../../src/lib/theme';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

// End-of-quiz screens (Figma 1114:482 / 1114:520 / 1365:1425, revised): a
// stroke-burst behind gradient letterform titles, the score in a light panel
// with a 5px gradient border, and the quizmaster with her sparkles. Static art
// (titles, bursts, quizmaster groups) ships as 3x PNG exports so the gradients
// render exactly as drawn. Geometry lives in the 394-wide design space.
const DESIGN_WIDTH = 394;

type Variant = 'highScore' | 'timesUp' | 'results';

const ART: Record<Variant, { burst: string; title: string; bubble: string; pose: number }> = {
  highScore: {
    burst: BURST_HIGH,
    title: TITLE_HIGH,
    bubble: BUBBLE_HIGH,
    pose: require('../../../assets/quiz/quizmaster-highscore.png'),
  },
  timesUp: {
    burst: BURST_TIME,
    title: TITLE_TIME,
    bubble: BUBBLE_TIME,
    pose: require('../../../assets/quiz/quizmaster-timesup.png'),
  },
  results: {
    burst: BURST_NORM,
    title: TITLE_NORM,
    bubble: BUBBLE_NORM,
    pose: require('../../../assets/quiz/quizmaster-results.png'),
  },
};

// Rendered bounding boxes per variant, from the Figma frames.
type Box = { x: number; y: number; w: number; h: number };
const BOXES: Record<Variant, Record<'burst' | 'title' | 'bubble' | 'pose', Box>> = {
  highScore: {
    burst: { x: 42, y: 44, w: 309, h: 263 },
    title: { x: 39, y: 109.5, w: 316.5, h: 99.5 },
    bubble: { x: 76, y: 338, w: 143.3, h: 77.9 },
    pose: { x: 205, y: 349, w: 156, h: 297 },
  },
  timesUp: {
    burst: { x: 66, y: 46, w: 261, h: 266 },
    title: { x: 48, y: 108, w: 298, h: 101.5 },
    bubble: { x: 92, y: 338, w: 143.3, h: 77.9 },
    pose: { x: 211, y: 358, w: 135, h: 292 },
  },
  results: {
    burst: { x: 94, y: 43, w: 205, h: 270 },
    title: { x: 97, y: 121.6, w: 199.7, h: 79.8 },
    bubble: { x: 102, y: 338, w: 143.3, h: 77.9 },
    pose: { x: 223, y: 358, w: 116, h: 295 },
  },
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;
  const tabInset = useTabBarInset();

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

  const variant: Variant = isNewBest
    ? 'highScore'
    : !isReview && modeId === 'timed'
      ? 'timesUp'
      : 'results';
  const art = ART[variant];
  const box = BOXES[variant];

  return (
    <View style={styles.screen}>
      <View style={{ position: 'absolute', left: box.burst.x * s, top: box.burst.y * s }}>
        <SvgXml xml={art.burst} width={box.burst.w * s} height={box.burst.h * s} />
      </View>
      <View
        style={{ position: 'absolute', left: box.title.x * s, top: box.title.y * s }}
        accessibilityRole="header"
        accessibilityLabel={variant === 'highScore' ? 'High Score!' : variant === 'timesUp' ? 'Time’s Up!' : 'Results'}
      >
        <SvgXml xml={art.title} width={box.title.w * s} height={box.title.h * s} />
      </View>

      {/* Score panel: light fill, 5px gradient border */}
      <View style={[styles.panel, { left: 48 * s, top: 216 * s, width: 298 * s, height: 70 * s }]}>
        <Svg style={StyleSheet.absoluteFill} width={298 * s} height={70 * s}>
          <Defs>
            <LinearGradient id="panelBorder" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#352C63" />
              <Stop offset="1" stopColor="#6C59C9" />
            </LinearGradient>
          </Defs>
          <Rect
            x={2.5 * s}
            y={2.5 * s}
            width={293 * s}
            height={65 * s}
            rx={16 * s}
            fill={colors.inset}
            stroke="url(#panelBorder)"
            strokeWidth={5 * s}
          />
        </Svg>
        <Text style={[styles.score, { fontSize: 55 * s }]}>{score}</Text>
      </View>

      {isReview ? (
        <Text style={[styles.reviewNote, { top: 296 * s, fontSize: 12 * s }]}>
          You reviewed {correct}/{answered} — due words updated
        </Text>
      ) : null}

      <Image
        source={art.pose}
        resizeMode="contain"
        style={{ position: 'absolute', left: box.pose.x * s, top: box.pose.y * s, width: box.pose.w * s, height: box.pose.h * s }}
        accessibilityIgnoresInvertColors
      />
      <View style={{ position: 'absolute', left: box.bubble.x * s, top: box.bubble.y * s }}>
        <SvgXml xml={art.bubble} width={box.bubble.w * s} height={box.bubble.h * s} />
      </View>

      {/* Buttons: 50 above the tab bar on any screen height */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.finish,
          { left: 39 * s, bottom: 50 * s + tabInset, width: 149 * s, height: 42 * s },
          pressed && styles.pressed,
        ]}
        onPress={() => router.replace('/quiz')}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { fontSize: 14 * s }]}>Finish</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.playAgain,
          { left: 206 * s, bottom: 50 * s + tabInset, width: 149 * s, height: 42 * s },
          pressed && styles.pressed,
        ]}
        onPress={() => router.replace(`/quiz/play?mode=${isReview ? 'review' : modeId}`)}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { fontSize: 14 * s }]}>Play Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  panel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.extrabold, color: '#352C63' },
  reviewNote: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.semibold,
    color: colors.textMuted,
  },
  button: {
    position: 'absolute',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finish: { backgroundColor: '#AE2E24' },
  playAgain: { backgroundColor: colors.primary },
  buttonText: { fontFamily: fonts.bold, color: colors.onPrimary, letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
});
