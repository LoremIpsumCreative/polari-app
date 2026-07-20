import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { IconTrophy } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useQuizStats } from '../../../src/lib/quizScores';
import { QUIZ_MODES } from '../../../src/lib/quizModes';
import { setStageDark } from '../../../src/lib/stageDark';
import { colors, fonts } from '../../../src/lib/theme';

const quizmasterArt = require('../../../assets/quiz/quizmaster.png');

// The quiz landing (Figma frame 1114:158, revised): two cream spotlight beams
// fan down from the top edge onto the quizmaster, the headline sits in a
// purple gradient panel, and the mode fan arcs over the tab bar's Quiz bubble.
// All geometry lives in the 394-wide design space.
const DESIGN_WIDTH = 394;
// Fan positions as distances up from the tab bar's top edge (y754 in the
// frame), so the arc hugs the bar on any screen height.
const FAN_LAYOUT = [
  { mode: 'ten', circle: { x: 169, b: 29 }, badge: { x: 174, b: 87 }, label: { x: 161, b: 12 } },
  { mode: 'timed', circle: { x: 242, b: 62 }, badge: { x: 247, b: 120 }, label: { x: 234, b: 45 } },
  { mode: 'life', circle: { x: 315, b: 29 }, badge: { x: 320, b: 87 }, label: { x: 307, b: 12 } },
] as const;

// Beam trapezoids, verbatim from the Figma vectors (Vector 7 / Vector 8).
const BEAMS = [
  { d: 'M423 606 L0 587.5 L270.489 0 L293.103 8.9e-05 L423 606 Z', tx: -24, ty: 1 },
  { d: 'M304.5 634 L0 657.5 L44.5 0 L70 0 L304.5 634 Z', tx: 74.5, ty: 0 },
] as const;

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { bestFor } = useQuizStats();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const uiOpacity = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [done, setDone] = useState(false);

  const playEntrance = useCallback(() => {
    setDone(false);
    heroOpacity.setValue(0);
    uiOpacity.setValue(0);
    const sequence = Animated.sequence([
      Animated.delay(100),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(uiOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);
    running.current = sequence;
    sequence.start(({ finished }) => {
      if (finished) setDone(true);
    });
  }, [heroOpacity, uiOpacity]);

  function skipEntrance() {
    if (done) return;
    running.current?.stop();
    heroOpacity.setValue(1);
    uiOpacity.setValue(1);
    setDone(true);
  }

  // Replay the entrance on focus; the landing is a dark stage, so the tab
  // bar's bubble ring goes dark with it.
  useFocusEffect(
    useCallback(() => {
      setStageDark(true);
      playEntrance();
      return () => {
        setStageDark(false);
        running.current?.stop();
      };
    }, [playEntrance])
  );

  return (
    <Pressable style={styles.stage} onPress={skipEntrance} accessibilityLabel="Quiz stage">
      {/* Bottom wash to near-black (Figma "gradient overlay", y 469–855) */}
      <Svg style={styles.wash} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.stageDeep} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.stageDeep} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
      </Svg>

      {/* Spotlight beams fanning from the top edge */}
      <Svg
        pointerEvents="none"
        style={styles.beams}
        width={394 * s}
        height={658 * s}
        viewBox="0 0 394 658"
      >
        <Defs>
          <LinearGradient id="beam" x1="0" y1="0" x2="0" y2="0.9">
            <Stop offset="0.668" stopColor="#FFF7D6" stopOpacity={1} />
            <Stop offset="1" stopColor="#2B273F" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {BEAMS.map((b) => (
          <Path
            key={b.d}
            d={b.d}
            transform={`translate(${b.tx}, ${b.ty})`}
            fill="url(#beam)"
            opacity={0.88}
          />
        ))}
      </Svg>

      <Animated.Image
        source={quizmasterArt}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: 124 * s,
          top: 219 * s,
          width: 190 * s,
          height: 306 * s,
          opacity: heroOpacity,
        }}
      />

      {/* Sparkle dot beside the fan */}
      <View
        style={{
          position: 'absolute',
          left: 78 * s,
          bottom: 123 * s,
          width: 12 * s,
          height: 11 * s,
          borderRadius: 6 * s,
          backgroundColor: '#F8E6A0',
        }}
      />

      {/* Headline panel (Figma Frame 78: purple gradient, r16) */}
      <Animated.View
        style={[
          styles.headingPanel,
          { left: 42 * s, top: 94 * s, width: 310 * s, height: 76 * s, opacity: uiOpacity },
        ]}
      >
        <Svg style={StyleSheet.absoluteFill} width={310 * s} height={76 * s}>
          <Defs>
            <LinearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#493B8B" />
              <Stop offset="1" stopColor="#352C63" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={16 * s} fill="url(#panel)" />
        </Svg>
        <Text style={[styles.heading, { fontSize: 34 * s }]}>How bona is your Polari?</Text>
      </Animated.View>

      {/* Mode fan with per-mode high-score badges */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: uiOpacity }]} pointerEvents="box-none">
        <View style={[styles.fanHost, { width: 394 * s }]} pointerEvents="box-none">
          {FAN_LAYOUT.map(({ mode, circle, badge, label }) => {
            const m = QUIZ_MODES[mode];
            const best = bestFor(mode);
            return (
              <View key={mode} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <View
                  style={[
                    styles.scoreBadge,
                    { left: badge.x * s, bottom: badge.b * s, width: 40 * s, height: 19 * s },
                  ]}
                >
                  <IconTrophy size={10 * s} color="#C25100" />
                  <Text style={[styles.scoreBadgeText, { fontSize: 10 * s }]}>
                    {String(best).padStart(2, '0')}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.modeCircle,
                    {
                      left: circle.x * s,
                      bottom: circle.b * s,
                      width: 50 * s,
                      height: 50 * s,
                      borderRadius: 25 * s,
                    },
                    pressed && styles.modePressed,
                  ]}
                  onPress={() => router.push(`/quiz/play?mode=${mode}`)}
                  disabled={loading || words.length < 4}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${m.label} quiz`}
                >
                  <m.Icon size={20 * s} color={colors.textMuted} />
                </Pressable>
                <Text
                  style={[
                    styles.modeLabel,
                    { left: label.x * s, bottom: label.b * s, width: 65 * s, fontSize: 10 * s },
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.stage,
    overflow: 'hidden',
  },
  // 386 / 855 of the frame, anchored to the bottom.
  wash: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45.1%' },
  beams: { position: 'absolute', top: 0, alignSelf: 'center' },
  headingPanel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fonts.display,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Explicit height: RN-web lets alignSelf centring collapse an absolute
  // child even with top/bottom set, which zero-heights the anchor box.
  fanHost: { position: 'absolute', top: 0, height: '100%', alignSelf: 'center' },
  scoreBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#223452',
    borderWidth: 0.5,
    borderColor: colors.textFaint,
    borderRadius: 999,
  },
  scoreBadgeText: {
    fontFamily: fonts.bold,
    color: '#FFF6F5',
  },
  modeCircle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePressed: {
    opacity: 0.85,
  },
  modeLabel: {
    position: 'absolute',
    fontFamily: fonts.bold,
    color: '#FFF6F5',
    textAlign: 'center',
  },
});
