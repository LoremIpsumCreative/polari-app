import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useWords } from '../../../src/lib/words';
import { useQuizStats } from '../../../src/lib/quizScores';
import { QUIZ_MODES, type QuizModeId } from '../../../src/lib/quizModes';
import { colors, fonts } from '../../../src/lib/theme';
import { useDesignScale } from '../../../src/lib/designScale';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';
import { Blob, FLAME, ModeGlyph } from '../../../src/components/quizLandingArt';
import { IconX } from '@tabler/icons-react-native';

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
// Button/Quiz Type placements from the frame (1114:158): 65x96 slots whose
// tops sit at y644, with the timed mode raised to y619. They are anchored to
// the foot of the 852 design rather than its top, so the fan keeps its
// relationship with the nav on a window taller than 852 — top-anchoring left
// it stranded mid-screen. The x values drop the frame's own 3px offset.
const DESIGN_H = 852;
const FAN_LAYOUT = [
  { mode: 'ten', x: 172, bottom: DESIGN_H - (644 + 96) },
  { mode: 'timed', x: 244, bottom: DESIGN_H - (619 + 96) },
  { mode: 'life', x: 316, bottom: DESIGN_H - (644 + 96) },
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
  'M2.69727 18.2688C1.19996 9.47605 8.48921 1.67341 17.3633 2.57058L122.058 13.1575C130.527 14.0142 136.099 22.4004 133.607 30.5403L125.754 56.1975C124.153 61.4271 119.555 65.1742 114.11 65.6868L24.8731 74.0882C17.8398 74.7502 11.4858 69.8784 10.2998 62.9143L2.69727 18.2688Z';
// The exported board is 136.707x76.6488 and sits inset inside the frame's
// 145x80 slot (left 3.29, top 2.03).
const SIGN_VIEW = { w: 136.707, h: 76.6488, dx: 3.29, dy: 2.03 };

// Her fill is a CROP: Figma shows only x 0-0.72002 and y 0-0.94004 of the
// source. Rather than cut the file (and lose the rest of the art), the full
// image is laid out oversized behind a 241x507 window, so the same region
// shows through — which is exactly what the fill's transform describes.
const HERO_CROP = {
  x: 0.000296541751595214,
  y: 0,
  w: 241 / 0.7200165390968323,
  h: 507 / 0.9400387406349182,
};

// Both purple blobs sit on a soft black shadow (blur 8.7, 25%). CSS drop-shadow
// has no spread term, so the signpost's 3px spread is folded into its blur.
const BLOB_SHADOW = (s: number, spread = 0) =>
  Platform.select({
    web: { filter: `drop-shadow(0 0 ${(8.7 + spread) * s}px rgba(0,0,0,0.25))` } as object,
    default: {
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: (8.7 + spread) * s,
      shadowOffset: { width: 0, height: 0 },
    },
  });

// Figma throws two shadows off the quizmaster, one each way: 5px blur at
// (+15,+12) and (-15,+12), both black at 10%. A silhouette shadow is the only
// kind that reads on cut-out art, so web uses drop-shadow filters; native falls
// back to its single rectangular shadow, which is closer than none.
const HERO_SHADOW = (s: number) =>
  Platform.select({
    web: {
      filter:
        `drop-shadow(${15 * s}px ${12 * s}px ${5 * s}px rgba(0,0,0,0.1)) ` +
        `drop-shadow(${-15 * s}px ${12 * s}px ${5 * s}px rgba(0,0,0,0.1))`,
    } as object,
    default: {
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 5 * s,
      shadowOffset: { width: 0, height: 12 * s },
    },
  });

const GOLD_INK = '#F5CD47';
const MODE_INK = '#6E5DC6';

export default function QuizIntroScreen() {
  const router = useRouter();
  const { words, loading } = useWords();
  const { bestFor } = useQuizStats();
  const s = useDesignScale();
  const tabInset = useTabBarInset();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const uiOpacity = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [done, setDone] = useState(false);
  // Picking a mode opens its How to Play card (frame 1904:3022 and siblings)
  // rather than dropping straight into the round.
  const [chosen, setChosen] = useState<QuizModeId | null>(null);

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

  // Replay the entrance on focus, and clear any mode the player had opened —
  // otherwise coming back from a round via the Quiz tab lands them on that
  // mode's How to Play card instead of the landing screen.
  useFocusEffect(
    useCallback(() => {
      setChosen(null);
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
            opacity={0.83}
          />
        ))}
      </Svg>

      {/* The frame gives her two drop shadows, one thrown each way. RN caps a
          view at one shadow, and on an image with alpha only a silhouette
          shadow looks right — so web uses a two-stop drop-shadow filter. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 153 * s,
            top: 262 * s,
            width: 241 * s,
            height: 507 * s,
            opacity: heroOpacity,
            overflow: 'hidden',
          },
          HERO_SHADOW(s),
        ]}
        pointerEvents="none"
      >
        <Image
          source={quizmasterArt}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            left: -HERO_CROP.x * HERO_CROP.w * s,
            top: -HERO_CROP.y * HERO_CROP.h * s,
            width: HERO_CROP.w * s,
            height: HERO_CROP.h * s,
          }}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

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
          BLOB_SHADOW(s),
        ]}
      >
        <Blob id="head" d={HEAD_BLOB} w={336} h={87} s={s} />
        <Text style={[styles.heading, { fontSize: 36 * s, top: 24 * s }]}>
          How <Text style={styles.headingAccent}>bona</Text> is your Polari?
        </Text>
      </Animated.View>

      {/* Signpost: a gold post with the board hung off its top */}
      {chosen ? (
        <Pressable
          style={styles.howToScrim}
          onPress={() => setChosen(null)}
          accessibilityLabel="Close"
        />
      ) : null}

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: uiOpacity }]} pointerEvents="none">
        <View
          style={{
            position: 'absolute',
            left: 81 * s,
            bottom: (DESIGN_H - 754) * s,
            width: 12 * s,
            height: 137 * s,
            backgroundColor: GOLD_INK,
          }}
        />
        <View
          style={[
            {
              position: 'absolute',
              left: 16 * s,
              bottom: (DESIGN_H - 702) * s,
              width: 145 * s,
              height: 80 * s,
            },
            BLOB_SHADOW(s, 3),
          ]}
        >
          <Blob
            id="sign"
            d={SIGN_BLOB}
            w={SIGN_VIEW.w}
            h={SIGN_VIEW.h}
            s={s}
            edgeFrom="#FFF7D6"
            edgeTo="#F7DA75"
            offsetX={SIGN_VIEW.dx}
            offsetY={SIGN_VIEW.dy}
          />
          <Text style={[styles.signText, { left: 28 * s, top: 27 * s, width: 90 * s, fontSize: 14 * s, lineHeight: 14 * s }]}>
            Choose your quiz type
          </Text>
        </View>
      </Animated.View>

      {/* Mode fan with per-mode high-score badges */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: uiOpacity }]} pointerEvents="box-none">
        <View style={[styles.fanHost, { width: 394 * s }]} pointerEvents="box-none">
          {FAN_LAYOUT.map(({ mode, x, bottom }) => {
            const m = QUIZ_MODES[mode];
            const best = bestFor(mode);
            return (
              <View
                key={mode}
                style={[
                  styles.modeSlot,
                  { left: x * s, bottom: bottom * s, width: 65 * s },
                  chosen && chosen !== mode && styles.modeSlotDimmed,
                ]}
                pointerEvents="box-none"
              >
                <View style={[styles.scoreBadge, { width: 40 * s, height: 19 * s }]}>
                  <Svg width={FLAME.w * s} height={FLAME.h * s} viewBox={`0 0 ${FLAME.w} ${FLAME.h}`}>
                    <Path d={FLAME.d} fill="#F38A3F" />
                  </Svg>
                  <Text style={[styles.scoreBadgeText, { fontSize: 10 * s }]}>
                    {String(best).padStart(2, '0')}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.modeCircle,
                    {
                      marginTop: 4 * s,
                      width: 50 * s,
                      height: 50 * s,
                      borderRadius: 25 * s,
                    },
                    pressed && styles.modePressed,
                  ]}
                  onPress={() => setChosen(mode)}
                  disabled={loading || words.length < 4}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${m.label} quiz`}
                >
                  <ModeGlyph name={mode} s={s} color={MODE_INK} />
                </Pressable>
                <Text style={[styles.modeLabel, { marginTop: 5 * s, fontSize: 10 * s }]}>
                  {m.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {chosen ? (
        <>
          <View
            style={[
              styles.howToCard,
              { left: 65 * s, top: 234 * s, width: 263 * s, borderRadius: 14 * s },
            ]}
          >
            <Pressable
              onPress={() => setChosen(null)}
              hitSlop={12}
              style={[styles.howToClose, { right: 19 * s, top: 20 * s }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <IconX size={14 * s} color={colors.textFaint} />
            </Pressable>
            <Text style={[styles.howToTitle, { fontSize: 60 * s, lineHeight: 53 * s }]}>
              {QUIZ_MODES[chosen].label}
            </Text>
            <Text style={[styles.howToKicker, { fontSize: 14 * s, marginTop: 32 * s }]}>
              How to play:
            </Text>
            <Text
              style={[
                styles.howToBody,
                { fontSize: 16 * s, lineHeight: 17.6 * s, marginTop: 18 * s },
              ]}
            >
              {QUIZ_MODES[chosen].blurb}
            </Text>
            <Pressable
              onPress={() => router.push(`/quiz/play?mode=${chosen}`)}
              style={({ pressed }) => [
                styles.howToStart,
                { marginTop: 32 * s, width: 199 * s, height: 50 * s },
                pressed && styles.modePressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.howToStartText, { fontSize: 14 * s }]}>Start Quiz</Text>
            </Pressable>
          </View>
        </>
      ) : null}
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
  modeSlot: { position: 'absolute', alignItems: 'center' },
  modeSlotDimmed: { opacity: 0.35 },
  scoreBadge: {
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePressed: {
    opacity: 0.85,
  },
  // Quiz/How to Play (1904:3346): card at x68 y234, 263 wide.
  howToScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.55)',
  },
  howToCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingTop: 42,
    paddingBottom: 32,
    alignItems: 'center',
  },
  howToClose: { position: 'absolute' },
  howToTitle: { fontFamily: fonts.display, color: colors.text, textAlign: 'center' },
  howToKicker: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
    color: colors.primary,
  },
  howToBody: {
    alignSelf: 'flex-start',
    fontFamily: fonts.regular,
    letterSpacing: 0.2,
    color: colors.text,
  },
  howToStart: {
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howToStartText: { fontFamily: fonts.bold, letterSpacing: 0.3, color: colors.onPrimary },
  modeLabel: {
    fontFamily: fonts.bold,
    color: '#FFF6F5',
    textAlign: 'center',
  },
});
