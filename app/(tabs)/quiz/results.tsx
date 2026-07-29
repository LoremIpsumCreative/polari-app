import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, SvgXml } from 'react-native-svg';
import { TITLE_HIGH, TITLE_NORM, TITLE_TIME } from '../../../src/components/resultsTitles';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useQuizStats } from '../../../src/lib/quizScores';
import { isQuizModeId } from '../../../src/lib/quizModes';
import { colors, fonts, DESIGN_WIDTH } from '../../../src/lib/theme';
import { useDesignScale } from '../../../src/lib/designScale';

// End-of-quiz screens, rebuilt to the revised Figma frames (1114:482 /
// 1114:520 / 1365:1425 in section 1353:936): a full-bleed golden stage, an
// arced letterform heading, the score in a white box with a heavy gradient
// border, the quizmaster with a speech bubble, and a blob "Play Again?" over a
// small "Finish" pill. Geometry lives in the mockups' 393-wide design space,
// whose content runs to y858 with the tab bar's top edge at y757.
const BAR_TOP = 757;

const stageArt = require('../../../assets/quiz/results-stage.png');

type Variant = 'highScore' | 'timesUp' | 'results';
type Box = { x: number; y: number; w: number; h: number };
type Line = {
  text: string;
  x: number;
  y: number;
  w: number;
  fs: number;
  lead: boolean;
  color: string;
};

// The speech bubbles are vectors rather than art: a rounded card with a tail
// notched out of its left edge, pointing back at the quizmaster.
const BUBBLE_FILL = '#F8F9FA';
const BUBBLE_STROKE = '#000000';
const BUBBLE_STROKE_WIDTH = 3;

const BUBBLES: Record<Variant, { w: number; h: number; d: string }> = {
  highScore: {
    w: 180.6,
    h: 77,
    d: 'M168.6 0 C175.227 0 180.6 5.37271 180.6 12 L180.6 65.001 C180.6 71.6282 175.227 77.001 168.6 77.001 L31.4075 77.001 C24.7804 77.0008 19.4078 71.6281 19.4075 65.001 L19.4075 53.6584 C19.4075 53.0118 18.9229 52.4806 18.3675 52.1494 L1.57257 42.1357 C-0.52419 40.8855 -0.52419 37.8254 1.57257 36.7979 L18.3675 28.5674 C18.9162 28.2985 19.4075 27.8131 19.4075 27.2021 L19.4075 12 C19.4077 5.3728 24.7803 0.000132815 31.4075 0 L168.6 0 Z',
  },
  timesUp: {
    w: 179.2,
    h: 78,
    d: 'M167.231 0 C173.858 4.85172e-05 179.231 5.37261 179.231 12 L179.231 66 C179.23 72.6272 173.858 78 167.231 78 L33.7991 78 C27.1719 77.9998 21.7993 72.6271 21.7991 66 L21.7991 62.618 C21.7991 56.3893 18.1844 50.7268 12.5344 48.1047 L2.04615 43.2373 C-0.456165 42.0757 -0.730731 38.8645 1.59596 37.9736 L20.7542 30.6387 C21.3067 30.4271 21.7991 29.9675 21.7991 29.3758 L21.7991 12 C21.7991 5.37268 27.1718 0.000146525 33.7991 0 L167.231 0 Z',
  },
  results: {
    w: 180.6,
    h: 83.5,
    d: 'M168.596 0 C175.223 0.000260687 180.596 5.3728 180.596 12 L180.596 71.5439 C180.596 78.1712 175.223 83.5437 168.596 83.5439 L35.1887 83.5439 C28.5615 83.5437 23.1888 78.1712 23.1887 71.5439 L23.1887 61.0388 C23.1887 60.6797 22.9508 60.3706 22.6321 60.2051 L1.90552 49.4346 C-0.491627 48.1886 -0.669601 44.8718 1.61353 43.9922 L21.3518 36.3877 C22.227 36.0506 23.1887 35.3915 23.1887 34.4536 L23.1887 12 C23.1888 5.37277 28.5615 0.00020392 35.1887 0 L168.596 0 Z',
  },
};

// "Rectangle 55" — the hand-drawn blob the Play Again label sits in.
// The banner's outline, exported from the frame's own Play Again Banner
// (1841:567) rather than redrawn — the hand-drawn version had a different
// top edge and a squarer taper.
const BLOB = {
  w: 200.689,
  h: 109.54,
  d: 'M8.81752 34.0051C7.70336 24.7855 14.6463 16.5573 23.9218 16.1045L175.209 8.71947C184.623 8.25991 192.393 15.997 191.973 25.4132L189.291 85.5524C188.892 94.5066 181.216 101.386 172.271 100.806L28.9177 91.5069C21.2325 91.0083 14.9929 85.1057 14.069 77.46L8.81752 34.0051Z',
};

const ACCENT = '#0C66E4';
const BODY_INK = '#121212';

// Title boxes are the headings' RENDER bounds — they include the 10px outline
// stroke, and sit centred on the heading group's own box.
const VARIANTS: Record<
  Variant,
  { title: string; titleBox: Box; pose: number; poseBox: Box; bubbleBox: Box; lines: Line[] }
> = {
  highScore: {
    title: TITLE_HIGH,
    titleBox: { x: 59, y: 101, w: 277, h: 102 },
    pose: require('../../../assets/quiz/quizmaster-highscore.png'),
    poseBox: { x: 0, y: 360, w: 220, h: 409 },
    bubbleBox: { x: 141, y: 389, w: 180.6, h: 77 },
    lines: [
      { text: 'Congratulations!', x: 173.6, y: 405, w: 135.3, fs: 16, lead: true, color: ACCENT },
      {
        text: 'You just set a new high score!',
        x: 178.9,
        y: 429,
        w: 123.6,
        fs: 12,
        lead: false,
        color: BODY_INK,
      },
    ],
  },
  timesUp: {
    title: TITLE_TIME,
    titleBox: { x: 53.9, y: 101.7, w: 285, h: 111 },
    pose: require('../../../assets/quiz/quizmaster-timesup.png'),
    poseBox: { x: -20, y: 377, w: 212, h: 380 },
    bubbleBox: { x: 154, y: 399, w: 179.2, h: 78 },
    lines: [
      { text: '1 Minute is Up!', x: 185.9, y: 418.7, w: 129.2, fs: 16, lead: true, color: ACCENT },
      {
        text: 'Let’s see how you\nscored this time.',
        x: 186.1,
        y: 441.9,
        w: 129.2,
        fs: 12,
        lead: false,
        color: BODY_INK,
      },
    ],
  },
  results: {
    title: TITLE_NORM,
    titleBox: { x: 92.5, y: 104.8, w: 210, h: 95 },
    pose: require('../../../assets/quiz/quizmaster-results.png'),
    poseBox: { x: 7, y: 375, w: 183, h: 382 },
    bubbleBox: { x: 144, y: 402, w: 180.6, h: 83.5 },
    lines: [
      { text: 'Quiz Complete!', x: 184.2, y: 424.3, w: 120.4, fs: 16, lead: true, color: ACCENT },
      {
        text: 'The answers are in. Here’s how you went.',
        x: 184.4,
        y: 446.7,
        w: 120.4,
        fs: 12,
        lead: false,
        color: BODY_INK,
      },
    ],
  },
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const s = useDesignScale();

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
  const { ready, recordGame, bestFor } = useQuizStats();

  const previousBest = useRef<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Wait for the stored stats: capturing the previous best before they land
    // reads it as 0 and every game looks like a new high score.
    if (saved || isReview || !ready) return;
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
  }, [session, isReview, ready]);

  // "High Score!" means a record was broken, so it needs a stored best to beat
  // — a first-ever game has nothing to beat and gets the ordinary result
  // screen. Signed-out players never see it either.
  const isNewBest =
    !isReview &&
    saved &&
    session != null &&
    score > 0 &&
    (previousBest.current ?? 0) > 0 &&
    score > (previousBest.current ?? 0);

  const variant: Variant = isNewBest
    ? 'highScore'
    : !isReview && modeId === 'timed'
      ? 'timesUp'
      : 'results';
  const v = VARIANTS[variant];
  const bubble = BUBBLES[variant];

  // Frame 1365:1425 places both controls outright: the Play Again banner at
  // x195/y568 and the Finish pill at x213/y672, 151x50. They used to hang off
  // the tab bar's top edge plus its inset, which drifted them ~25 low and left
  // the pill almost touching the bar.

  const titleLabel =
    variant === 'highScore' ? 'High Score!' : variant === 'timesUp' ? 'Time’s Up!' : 'Results';

  return (
    <View style={styles.screen}>
      <Image
        source={stageArt}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      {/* Warm wash over the lower third (Figma "gradient overlay", y556-858) */}
      <Svg
        style={[styles.overlay, { top: 556 * s }]}
        width="100%"
        height={302 * s}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#121212" stopOpacity={0} />
            <Stop offset="1" stopColor="#3C2000" stopOpacity={0.49} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
      </Svg>

      <View
        style={{ position: 'absolute', left: v.titleBox.x * s, top: v.titleBox.y * s }}
        accessibilityRole="header"
        accessibilityLabel={titleLabel}
      >
        <SvgXml xml={v.title} width={v.titleBox.w * s} height={v.titleBox.h * s} />
      </View>

      {/* Score: white box with a 9px gradient border. The container carries the
          drop shadow, because a stroked SVG path cannot cast one. */}
      <View
        style={[
          styles.scoreBox,
          {
            left: 126 * s,
            top: 222 * s,
            width: 142 * s,
            height: 110 * s,
            borderRadius: 20.5 * s,
            shadowRadius: 4.2 * s,
            shadowOffset: { width: 0, height: 6 * s },
          },
        ]}
      >
        <Svg style={StyleSheet.absoluteFill} width={142 * s} height={110 * s}>
          <Defs>
            <LinearGradient id="scoreBorder" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#352C63" />
              <Stop offset="1" stopColor="#6C59C9" />
            </LinearGradient>
          </Defs>
          <Rect
            x={4.5 * s}
            y={4.5 * s}
            width={133 * s}
            height={101 * s}
            rx={16 * s}
            fill="#FFFFFF"
            stroke="url(#scoreBorder)"
            strokeWidth={9 * s}
          />
        </Svg>
        <Text style={[styles.score, { fontSize: 100 * s, lineHeight: 110 * s }]}>{score}</Text>
      </View>

      <Image
        source={v.pose}
        resizeMode="cover"
        style={{
          position: 'absolute',
          left: v.poseBox.x * s,
          top: v.poseBox.y * s,
          width: v.poseBox.w * s,
          height: v.poseBox.h * s,
        }}
        accessibilityIgnoresInvertColors
      />

      {/* Speech bubble, padded so the 3px stroke isn't clipped by the viewport */}
      <Svg
        style={{ position: 'absolute', left: (v.bubbleBox.x - 2) * s, top: (v.bubbleBox.y - 2) * s }}
        width={(bubble.w + 4) * s}
        height={(bubble.h + 4) * s}
        viewBox={`-2 -2 ${bubble.w + 4} ${bubble.h + 4}`}
        pointerEvents="none"
      >
        <Path
          d={bubble.d}
          fill={BUBBLE_FILL}
          stroke={BUBBLE_STROKE}
          strokeWidth={BUBBLE_STROKE_WIDTH}
        />
      </Svg>
      {v.lines.map((l) => (
        <Text
          key={l.text}
          style={[
            styles.bubbleLine,
            {
              left: l.x * s,
              top: l.y * s,
              width: l.w * s,
              fontSize: l.fs * s,
              lineHeight: l.fs * 1.15 * s,
              color: l.color,
              fontFamily: l.lead ? fonts.boldItalic : fonts.semiboldItalic,
            },
          ]}
        >
          {l.text}
        </Text>
      ))}

      {isReview ? (
        <Text style={[styles.reviewNote, { top: 500 * s, fontSize: 12 * s }]}>
          You reviewed {correct}/{answered} — due words updated
        </Text>
      ) : null}

      {/* Play Again: the blob, with its label centred over it */}
      <Pressable
        style={({ pressed }) => [
          {
            position: 'absolute',
            left: 195 * s,
            top: 568 * s,
            width: BLOB.w * s,
            height: BLOB.h * s,
          },
          pressed && styles.pressed,
        ]}
        onPress={() => router.replace(`/quiz/play?mode=${isReview ? 'review' : modeId}`)}
        accessibilityRole="button"
        accessibilityLabel="Play again"
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width={BLOB.w * s}
          height={BLOB.h * s}
          viewBox={`0 0 ${BLOB.w} ${BLOB.h}`}
        >
          <Defs>
            <LinearGradient id="blobFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#493B8B" />
              <Stop offset="1" stopColor="#352C63" />
            </LinearGradient>
            <LinearGradient id="blobEdge" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF7D6" />
              <Stop offset="1" stopColor="#F7DA75" />
            </LinearGradient>
          </Defs>
          <Path d={BLOB.d} fill="url(#blobFill)" stroke="url(#blobEdge)" strokeWidth={5} />
        </Svg>
        <Text style={[styles.playAgain, { fontSize: 38 * s, lineHeight: 38 * s, top: 26 * s }]}>
          Play Again?
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.finish,
          { left: 213 * s, top: 672 * s, width: 151 * s, height: 50 * s },
          pressed && styles.pressed,
        ]}
        onPress={() => router.replace('/quiz')}
        accessibilityRole="button"
      >
        <Text style={[styles.finishText, { fontSize: 14 * s }]}>Finish</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // The golden stage art covers this; the fill only shows for the instant
  // before it decodes.
  screen: { flex: 1, backgroundColor: '#F5C542', overflow: 'hidden' },
  overlay: { position: 'absolute', left: 0, right: 0 },
  scoreBox: {
    position: 'absolute',
    alignItems: 'center',
    // Sits under the SVG's gradient border, so it only ever reads as the
    // shadow caster's silhouette.
    backgroundColor: '#493B8B',
    shadowColor: '#000000',
    shadowOpacity: 0.37,
    elevation: 6,
  },
  score: { fontFamily: fonts.extrabold, color: '#352C63', letterSpacing: 1 },
  bubbleLine: { position: 'absolute', textAlign: 'center' },
  reviewNote: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  playAgain: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  finish: {
    position: 'absolute',
    // purple/800, the same stop the Play Again blob opens on — the pill was a
    // near-black navy, which the frames never show.
    backgroundColor: '#493B8B',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: { fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
});
