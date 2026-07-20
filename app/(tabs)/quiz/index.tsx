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
import { colors, fonts } from '../../../src/lib/theme';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

const quizmasterArt = require('../../../assets/quiz/quizmaster.png');

// The quiz landing (Figma frame 1114:158, revised): two cream spotlight beams
// rake down onto the quizmaster, the headline sits in a hand-drawn gold-edged
// blob, a signpost points at the mode fan, and the fan itself arcs over the tab
// bar's Quiz bubble. All geometry lives in the 394-wide design space, whose
// content runs to y855 with the tab bar's top edge at y754.
const DESIGN_WIDTH = 394;
const BAR_TOP = 754;

// Fan positions as distances up from the tab bar's top edge, so the arc hugs
// the bar on any screen height.
const FAN_LAYOUT = [
  { mode: 'ten', circle: { x: 172, b: 29 }, badge: { x: 177, b: 87 }, label: { x: 165, b: 12 } },
  { mode: 'timed', circle: { x: 241, b: 62 }, badge: { x: 246, b: 120 }, label: { x: 234, b: 45 } },
  { mode: 'life', circle: { x: 310, b: 29 }, badge: { x: 315, b: 87 }, label: { x: 303, b: 12 } },
] as const;

// The two spotlight beams, verbatim from the Figma vectors. Vector 8 sits
// behind Vector 7, and each fades to nothing over the stage colour.
const BEAMS = [
  {
    id: 'beam8',
    d: 'M54 0 L373.5 351.5 L376 757.5 L168 757.5 L0 0 L54 0 Z',
    tx: 20.5, ty: 0, from: '#F8E6A0', at: 0.636,
    v: { x1: 0.5294, y1: -0.0186, x2: 1.3353, y2: 0.9035 },
  },
  {
    id: 'beam7',
    d: 'M396 772 L0 772 L248.989 0 L337.5 0 L396 426 L396 772 Z',
    tx: -2.5, ty: 1, from: '#FCEFBB', at: 0.599,
    v: { x1: 1.3916, y1: 0.097, x2: 1.0557, y2: 1.1326 },
  },
] as const;

// "Rectangle 55" twice over: the headline blob and the signpost board. Both are
// a purple gradient inside a 5px gold edge.
const HEAD_BLOB =
  'M2.62342 21.9117 C1.23436 12.3347 8.59898 3.72631 18.2756 3.61617 L315.543 0.232833 C325.941 0.11449 333.687 9.79048 331.296 19.9104 L318.358 74.6786 C316.652 81.8993 310.206 87 302.786 87 L25.9106 87 C17.9612 87 11.2173 81.1637 10.0763 73.2966 L2.62342 21.9117 Z';
const SIGN_BLOB =
  'M10.1798 59.3923 L3.55222 20.7248 C1.76587 10.3027 10.4005 1.04491 20.9216 2.10193 L115.554 11.6094 C125.609 12.6195 132.221 22.5827 129.246 32.2402 L122.606 53.7897 C120.7 59.9774 115.252 64.4062 108.806 65.0092 L27.4399 72.6198 C19.1139 73.3985 11.5925 67.6344 10.1798 59.3923 Z';

const BLOB_FILL = ['#493B8B', '#352C63'] as const;
const BLOB_EDGE = ['#F7DA75', '#F5CD47'] as const;
const GOLD_INK = '#F5CD47';
const MODE_INK = '#6E5DC6';

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { bestFor } = useQuizStats();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;
  const tabInset = useTabBarInset();

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

  // Replay the entrance on focus.
  useFocusEffect(
    useCallback(() => {
      playEntrance();
      return () => {
        running.current?.stop();
      };
    }, [playEntrance])
  );

  return (
    <Pressable style={styles.stage} onPress={skipEntrance} accessibilityLabel="Quiz stage">
      {/* Spotlight beams raking down from the top edge */}
      <Svg
        pointerEvents="none"
        style={styles.beams}
        width={394 * s}
        height={855 * s}
        viewBox="0 0 394 855"
      >
        <Defs>
          {BEAMS.map((b) => (
            <LinearGradient
              key={b.id}
              id={b.id}
              x1={b.v.x1}
              y1={b.v.y1}
              x2={b.v.x2}
              y2={b.v.y2}
            >
              <Stop offset={b.at} stopColor={b.from} stopOpacity={1} />
              <Stop offset="1" stopColor={colors.stage} stopOpacity={0} />
            </LinearGradient>
          ))}
        </Defs>
        {BEAMS.map((b) => (
          <Path
            key={b.id}
            d={b.d}
            transform={`translate(${b.tx}, ${b.ty})`}
            fill={`url(#${b.id})`}
          />
        ))}
      </Svg>

      <Animated.Image
        source={quizmasterArt}
        resizeMode="contain"
        style={{
          position: 'absolute',
          left: 153 * s,
          top: 262 * s,
          width: 241 * s,
          height: 507 * s,
          opacity: heroOpacity,
        }}
      />

      {/* Bottom wash to near-black (Figma "gradient overlay", y 469–855) */}
      <Svg style={styles.wash} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="wash" x1="0.721" y1="0.0597" x2="0.721" y2="0.5017">
            <Stop offset="0" stopColor={colors.stageDeep} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.stageDeep} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
      </Svg>

      {/* Sparkle dot above the signpost */}
      <View
        style={{
          position: 'absolute',
          left: 79 * s,
          bottom: 125 * s + tabInset,
          width: 12 * s,
          height: 11 * s,
          borderRadius: 6 * s,
          backgroundColor: '#F8E6A0',
        }}
      />

      {/* Headline blob (Figma Group 111) */}
      <Animated.View
        style={[
          styles.headingPanel,
          { left: 29 * s, top: 97 * s, width: 336 * s, height: 87 * s, opacity: uiOpacity },
        ]}
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width={336 * s}
          height={87 * s}
          viewBox="-3 -3 342 93"
        >
          <Defs>
            <LinearGradient id="headFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={BLOB_FILL[0]} />
              <Stop offset="1" stopColor={BLOB_FILL[1]} />
            </LinearGradient>
            <LinearGradient id="headEdge" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={BLOB_EDGE[0]} />
              <Stop offset="1" stopColor={BLOB_EDGE[1]} />
            </LinearGradient>
          </Defs>
          <Path d={HEAD_BLOB} fill="url(#headFill)" stroke="url(#headEdge)" strokeWidth={5} />
        </Svg>
        <Text style={[styles.heading, { fontSize: 36 * s, top: 24 * s }]}>
          How <Text style={styles.headingAccent}>bona</Text> is your Polari?
        </Text>
      </Animated.View>

      {/* Signpost: a gold post with the board hung off its top */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: uiOpacity }]} pointerEvents="none">
        <View
          style={{
            position: 'absolute',
            left: 84 * s,
            bottom: tabInset,
            width: 8 * s,
            height: 129 * s,
            backgroundColor: GOLD_INK,
          }}
        />
        <View
          style={{ position: 'absolute', left: 20 * s, bottom: 52 * s + tabInset, width: 135 * s, height: 74 * s }}
        >
          <Svg
            style={StyleSheet.absoluteFill}
            width={135 * s}
            height={74 * s}
            viewBox="-3 -3 141 80"
          >
            <Defs>
              <LinearGradient id="signFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={BLOB_FILL[0]} />
                <Stop offset="1" stopColor={BLOB_FILL[1]} />
              </LinearGradient>
              <LinearGradient id="signEdge" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={BLOB_EDGE[0]} />
                <Stop offset="1" stopColor={BLOB_EDGE[1]} />
              </LinearGradient>
            </Defs>
            <Path d={SIGN_BLOB} fill="url(#signFill)" stroke="url(#signEdge)" strokeWidth={5} />
          </Svg>
          <Text style={[styles.signText, { left: 24 * s, top: 25 * s, width: 83 * s, fontSize: 14 * s, lineHeight: 12 * s }]}>
            Choose your quiz type
          </Text>
        </View>
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
                    { left: badge.x * s, bottom: badge.b * s + tabInset, width: 40 * s, height: 19 * s },
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
                      bottom: circle.b * s + tabInset,
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
                  <m.Icon size={20 * s} color={MODE_INK} />
                </Pressable>
                <Text
                  style={[
                    styles.modeLabel,
                    { left: label.x * s, bottom: label.b * s + tabInset, width: 65 * s, fontSize: 10 * s },
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
  // 352 / 855 of the frame, anchored to the bottom.
  wash: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '41.2%' },
  beams: { position: 'absolute', top: 0, alignSelf: 'center' },
  headingPanel: { position: 'absolute' },
  heading: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.display,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headingAccent: { color: GOLD_INK },
  signText: {
    position: 'absolute',
    fontFamily: fonts.semibold,
    color: '#FFFBEC',
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
