import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';
import { IconTrophy } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useQuizStats } from '../../../src/lib/quizScores';
import { QUIZ_MODES } from '../../../src/lib/quizModes';
import { setStageDark } from '../../../src/lib/stageDark';
import { colors, spacing, fonts } from '../../../src/lib/theme';

const quizmasterArt = require('../../../assets/quiz/quizmaster.png');
const shapeYellow = require('../../../assets/quiz/shape-yellow.png');
const shapeTeal = require('../../../assets/quiz/shape-teal.png');
const shapeRed = require('../../../assets/quiz/shape-red.png');


const SLIDE_MS = 700;
const SLIDE_STAGGER_MS = 200;
const EASE_OUT = Easing.out(Easing.cubic);

// The always-on mode fan, positioned per the Figma Landing (frame 1114:158).
// Coordinates are in the 394-wide design space; the overlay spans y 614–754
// (bottom of the stage, arcing over the tab bar's Quiz bubble).
const FAN_DESIGN_WIDTH = 394;
const FAN_DESIGN_HEIGHT = 140;
const FAN_LAYOUT = [
  { mode: 'ten', circle: { x: 169, y: 61 }, badge: { x: 174, y: 34 }, label: { x: 161, y: 119 } },
  { mode: 'timed', circle: { x: 242, y: 28 }, badge: { x: 247, y: 1 }, label: { x: 234, y: 86 } },
  { mode: 'life', circle: { x: 315, y: 61 }, badge: { x: 320, y: 34 }, label: { x: 307, y: 119 } },
] as const;

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { bestFor } = useQuizStats();
  const { width } = useWindowDimensions();

  // Stage geometry: spotlight ellipse sized to the screen like the Figma frame
  const stageWidth = Math.min(width, 430);
  const spotlightW = stageWidth * 0.92;
  const spotlightH = spotlightW * 1.22;

  const quizmasterOpacity = useRef(new Animated.Value(0)).current;
  const yellowSlide = useRef(new Animated.Value(1)).current; // 1 = off-screen, 0 = settled
  const tealSlide = useRef(new Animated.Value(1)).current;
  const redSlide = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [done, setDone] = useState(false);

  const playEntrance = useCallback(() => {
    setDone(false);
    quizmasterOpacity.setValue(0);
    yellowSlide.setValue(1);
    tealSlide.setValue(1);
    redSlide.setValue(1);
    textOpacity.setValue(0);

    // Spotlight is on stage from the first frame; then the quizmaster fades
    // in, the set pieces slide in one at a time, and the copy fades up last.
    const sequence = Animated.sequence([
      Animated.delay(100),
      Animated.timing(quizmasterOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.delay(100),
      Animated.stagger(SLIDE_STAGGER_MS, [
        Animated.timing(yellowSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
        Animated.timing(tealSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
        Animated.timing(redSlide, {
          toValue: 0,
          duration: SLIDE_MS,
          easing: EASE_OUT,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(textOpacity, {
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
  }, [quizmasterOpacity, yellowSlide, tealSlide, redSlide, textOpacity]);

  function skipEntrance() {
    if (done) return;
    running.current?.stop();
    quizmasterOpacity.setValue(1);
    yellowSlide.setValue(0);
    tealSlide.setValue(0);
    redSlide.setValue(0);
    textOpacity.setValue(1);
    setDone(true);
  }

  // Replay the entrance every time the tab gains focus; the landing is a dark
  // stage, so the tab bar's bubble ring goes dark with it.
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

  // The fan overlay scales with the stage width.
  const fs = stageWidth / FAN_DESIGN_WIDTH;

  return (
    <Pressable style={styles.stage} onPress={skipEntrance} accessibilityLabel="Quiz stage">
      <Animated.Text style={[styles.heading, { opacity: textOpacity }]}>
        How bona is your Polari?
      </Animated.Text>

      <View style={[styles.spotlightWrap, { width: spotlightW, height: spotlightH }]}>
        <Svg width={spotlightW} height={spotlightH}>
          <Ellipse
            cx={spotlightW / 2}
            cy={spotlightH / 2}
            rx={spotlightW / 2}
            ry={spotlightH / 2}
            fill={colors.spotlight}
          />
        </Svg>

        <Animated.Image
          source={shapeYellow}
          resizeMode="contain"
          style={[
            styles.shapeYellow,
            {
              transform: [
                {
                  translateY: yellowSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -720],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.Image
          source={shapeTeal}
          resizeMode="contain"
          style={[
            styles.shapeTeal,
            {
              transform: [
                {
                  translateX: tealSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 520],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.Image
          source={shapeRed}
          resizeMode="contain"
          style={[
            styles.shapeRed,
            {
              transform: [
                {
                  translateX: redSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -520],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.Image
          source={quizmasterArt}
          resizeMode="contain"
          style={[styles.quizmaster, { opacity: quizmasterOpacity }]}
        />
      </View>

      {/* Washes the stage (and the quizmaster's feet) to near-black at the
          bottom — Figma's "gradient overlay": #121212 alpha 0 → 1 over the
          lower 386 of the 855-tall frame. Sits above the art, below the UI. */}
      <Svg style={styles.stageFade} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="stageFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.stageDeep} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.stageDeep} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#stageFade)" />
      </Svg>

      {/* Always-on mode fan: choose-your-quiz callout + three modes with their
          high-score badges, arcing over the tab bar's Quiz bubble. */}
      <Animated.View
        style={[
          styles.fan,
          {
            width: FAN_DESIGN_WIDTH * fs,
            height: FAN_DESIGN_HEIGHT * fs,
            opacity: textOpacity,
          },
        ]}
      >
        <View
          style={[
            styles.callout,
            { left: 26 * fs, top: 0, width: 131 * fs, height: 56 * fs, borderRadius: 6 * fs },
          ]}
        >
          <Text style={[styles.calloutText, { fontSize: 14 * fs }]}>Choose your{'\n'}quiz type</Text>
        </View>

        {FAN_LAYOUT.map(({ mode, circle, badge, label }) => {
          const m = QUIZ_MODES[mode];
          const best = bestFor(mode);
          return (
            <View key={mode}>
              <View
                style={[
                  styles.scoreBadge,
                  { left: badge.x * fs, top: badge.y * fs, width: 40 * fs, height: 19 * fs },
                ]}
              >
                <IconTrophy size={10 * fs} color="#C25100" />
                <Text style={[styles.scoreBadgeText, { fontSize: 10 * fs }]}>
                  {String(best).padStart(2, '0')}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.modeCircle,
                  {
                    left: circle.x * fs,
                    top: circle.y * fs,
                    width: 50 * fs,
                    height: 50 * fs,
                    borderRadius: 25 * fs,
                  },
                  pressed && styles.modePressed,
                ]}
                onPress={() => router.push(`/quiz/play?mode=${mode}`)}
                disabled={loading || words.length < 4}
                accessibilityRole="button"
                accessibilityLabel={`Start ${m.label} quiz`}
              >
                <m.Icon size={20 * fs} color={colors.textMuted} />
              </Pressable>
              <Text
                style={[
                  styles.modeLabel,
                  { left: label.x * fs, top: label.y * fs, width: 65 * fs, fontSize: 10 * fs },
                ]}
              >
                {m.label}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.stage,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: spacing.xl + spacing.md,
  },
  // 386 / 855 of the Figma frame, anchored to the bottom.
  stageFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45.1%' },
  heading: {
    marginTop: spacing.md,
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  spotlightWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shapeYellow: {
    position: 'absolute',
    width: '52%',
    height: '78%',
    left: '20%',
    top: '9%',
  },
  shapeTeal: {
    position: 'absolute',
    width: '62%',
    height: '38%',
    right: '4%',
    top: '10%',
  },
  shapeRed: {
    position: 'absolute',
    width: '40%',
    height: '38%',
    left: '4%',
    bottom: '10%',
  },
  quizmaster: {
    position: 'absolute',
    width: '68%',
    height: '78%',
    bottom: '7%',
  },
  fan: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  callout: {
    position: 'absolute',
    backgroundColor: '#223452',
    borderWidth: 4,
    borderColor: '#F8E6A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutText: {
    fontFamily: fonts.semibold,
    color: '#FFFBEC',
    textAlign: 'center',
  },
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
