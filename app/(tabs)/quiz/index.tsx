import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useWords } from '../../../src/lib/words';
import { useQuizStats } from '../../../src/lib/quizScores';
import { QUIZ_MODES, type QuizModeId } from '../../../src/lib/quizModes';
import type { Palette } from '../../../src/lib/palette';
import { useColors, useThemedStyles } from '../../../src/lib/appearance';
import { fonts, DESIGN_WIDTH, DESIGN_HEIGHT } from '../../../src/lib/theme';
import { useDesignScale } from '../../../src/lib/designScale';
import { useReducedMotion } from '../../../src/lib/reducedMotion';
import { Blob, FLAME, ModeGlyph } from '../../../src/components/quizLandingArt';
import IconX from '@tabler/icons-react-native/IconX';

const quizmasterArt = require('../../../assets/quiz/quizmaster.png');

// The quiz landing (Figma frame 1114:158, revised): two cream spotlight beams
// rake down onto the quizmaster, the headline sits in a hand-drawn gold-edged
// blob, a signpost points at the mode fan, and the fan itself arcs over the tab
// bar's Quiz bubble. All geometry lives in the 393-wide design space, whose
// content runs to y855 with the tab bar's top edge at y754.
const BAR_TOP = 754;

// Fan positions as distances up from the tab bar's top edge, so the arc hugs
// the bar on any screen height.
// Button/Quiz Type placements from the frame (1114:158): 65x96 slots whose
// tops sit at y644, with the timed mode raised to y619. They are anchored to
// the foot of the FRAME rather than its top, so the fan keeps its
// relationship with the nav on any viewport height — top-anchoring left
// it stranded mid-screen. The x values drop the frame's own 3px offset.
const DESIGN_H = 852;
const FAN_LAYOUT = [
  { mode: 'ten', x: 172, bottom: DESIGN_H - (644 + 96) },
  { mode: 'timed', x: 244, bottom: DESIGN_H - (619 + 96) },
  { mode: 'life', x: 316, bottom: DESIGN_H - (644 + 96) },
] as const;

// The two spotlight beams, verbatim from the Figma vectors (1696:655 behind
// 1696:654). Each fades to nothing over the stage colour.
//
// The gradient vectors are Figma's own userSpaceOnUse coordinates, in the
// beam's local space — i.e. the numbers straight off the exported SVG. They
// used to be hand-converted to normalised objectBoundingBox values and the
// conversion was wrong in both beams (beam8 read 0.53,-0.02 → 1.34,0.90 where
// the true axis is 45.5,52.5 → 348.5,751 over a 376x757.5 box, so 0.12,0.07 →
// 0.93,0.99). That pointed the fade the wrong way across the beam and is why
// the lit band died halfway down the stage. Keeping userSpaceOnUse means the
// values can be diffed against the SVG export directly, with no arithmetic in
// between to get wrong again.
const BEAMS = [
  {
    id: 'beam8',
    d: 'M54 0L373.5 351.5L376 757.5H168L0 0H54Z',
    tx: 23.5,
    ty: 0,
    from: '#F8E6A0',
    at: 0.636376,
    v: { x1: 45.5, y1: 52.5, x2: 348.5, y2: 751 },
  },
  {
    id: 'beam7',
    d: 'M396 772H0L248.989 0H337.5L396 426V772Z',
    tx: 0.5,
    ty: 1,
    from: '#FCEFBB',
    at: 0.598506,
    v: { x1: 293.5, y1: 32, x2: 160.5, y2: 831.5 },
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

// She is exported at frame scale now — a 260x524 canvas whose artwork starts
// 8px in from the left — so she is placed 1:1 rather than cropped. The old
// export was the full 808x1300 illustration, which had to be laid out
// oversized behind a 241x507 window to show just the region the frame used.
// Offsetting the canvas by that 8px padding puts her head on y262 and lets her
// bleed off the right edge, exactly as the frame draws her.
const HERO = { left: 145, top: 262, w: 260, h: 524 };

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

// ─────────────────────────────────────────────────────────────────────────────
// Entrance choreography — Figma frame 1114:158, 5.17s one-shot.
//
// Start times and durations are absolute seconds off the frame's own timeline,
// so this table can be read straight against the Figma motion export rather
// than back-calculated from nested delays. Everything is expressed as
// "begin at t, run for d", and Animated.parallel of delay+timing pairs
// reproduces that exactly.
//
// Two layers in the export are deliberately not implemented: "Text Container"
// and "Quiz Type Sign" fade in at 2.49s while their parents (LandingPrompt at
// -200px, TypeSign at -192px) are still off-screen, so their motion is never
// visible. Animating them would cost work and change nothing on screen.
//
// The beams settle at 0.83, not 1 — that is the layer opacity in the frame.
const T = {
  beam8: { at: 300, dur: 930 },
  beam7: { at: 1230, dur: 940 },
  hero: { at: 2180, dur: 530, fromY: 12 },
  prompt: { at: 2790, dur: 640, fromY: -200 },
  // The sign swings: rotation leads the slide, both landing together on 3.53s.
  signRotate: { at: 2420, dur: 1110, from: -20, mid: -7.88 },
  signSlide: { at: 3140, dur: 390, fromX: -192 },
  buttons: [
    { at: 3720, fade: 250, move: 450, fromX: 72, fromY: 76 },
    { at: 3830, fade: 250, move: 450, fromX: 0, fromY: 101 },
    { at: 3970, fade: 250, move: 450, fromX: -72, fromY: 76 },
  ],
} as const;

// CSS ease-out / ease-in, and the overshoot Figma reports on the mode buttons
// as cubic-bezier(0.45, 1.45, 0.8, 1) — the >1 control point is what makes
// them pop past their resting place and settle back.
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE_OUT_BACK = Easing.bezier(0.45, 1.45, 0.8, 1);

/** "Hold still until `at`, then run for `dur`" — one row of the table above. */
function cue(
  value: Animated.Value,
  toValue: number,
  { at, dur, easing = EASE_OUT }: { at: number; dur: number; easing?: typeof EASE_OUT },
) {
  return Animated.sequence([
    Animated.delay(at),
    Animated.timing(value, { toValue, duration: dur, easing, useNativeDriver: false }),
  ]);
}

export default function QuizIntroScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { words, loading } = useWords();
  const { bestFor } = useQuizStats();
  const s = useDesignScale();

  // One driver per animated layer in the frame. Each runs 0 -> 1 and the views
  // interpolate their own opacity/offset off it, so the table above stays the
  // single description of the timing.
  const beam8 = useRef(new Animated.Value(0)).current;
  const beam7 = useRef(new Animated.Value(0)).current;
  const hero = useRef(new Animated.Value(0)).current;
  const prompt = useRef(new Animated.Value(0)).current;
  const signRotate = useRef(new Animated.Value(0)).current;
  const signSlide = useRef(new Animated.Value(0)).current;
  const btn0 = useRef(new Animated.Value(0)).current;
  const btn1 = useRef(new Animated.Value(0)).current;
  const btn2 = useRef(new Animated.Value(0)).current;
  const btnFade0 = useRef(new Animated.Value(0)).current;
  const btnFade1 = useRef(new Animated.Value(0)).current;
  const btnFade2 = useRef(new Animated.Value(0)).current;
  const btns = [btn0, btn1, btn2];
  const btnFades = [btnFade0, btnFade1, btnFade2];

  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [done, setDone] = useState(false);
  const reduceMotion = useReducedMotion();
  // Picking a mode opens its How to Play card (frame 1904:3022 and siblings)
  // rather than dropping straight into the round.
  const [chosen, setChosen] = useState<QuizModeId | null>(null);

  const drivers = useMemo(
    () => [
      beam8,
      beam7,
      hero,
      prompt,
      signRotate,
      signSlide,
      btn0,
      btn1,
      btn2,
      btnFade0,
      btnFade1,
      btnFade2,
    ],
    [
      beam8,
      beam7,
      hero,
      prompt,
      signRotate,
      signSlide,
      btn0,
      btn1,
      btn2,
      btnFade0,
      btnFade1,
      btnFade2,
    ],
  );

  /** Jump the whole stage to its resting state. Used by the tap-to-skip, and
   *  as the entire "animation" when Reduce Motion is on. */
  const settle = useCallback(() => {
    for (const d of drivers) d.setValue(1);
    setDone(true);
  }, [drivers]);

  const playEntrance = useCallback(() => {
    // Reduce Motion: present the finished screen rather than a faster version
    // of the same movement. Nothing slides, fades or swings.
    if (reduceMotion.current) {
      settle();
      return;
    }
    setDone(false);
    for (const d of drivers) d.setValue(0);

    const sequence = Animated.parallel(
      [
        cue(beam8, 1, T.beam8),
        cue(beam7, 1, T.beam7),
        cue(hero, 1, T.hero),
        cue(prompt, 1, T.prompt),
        cue(signRotate, 1, T.signRotate),
        cue(signSlide, 1, T.signSlide),
        ...T.buttons.flatMap((b, i) => [
          cue(btnFades[i], 1, { at: b.at, dur: b.fade }),
          cue(btns[i], 1, { at: b.at, dur: b.move, easing: EASE_OUT_BACK }),
        ]),
      ],
      // Each layer's cue is independent; one finishing must not curtail the rest.
      { stopTogether: false },
    );
    running.current = sequence;
    sequence.start(({ finished }) => {
      if (finished) setDone(true);
    });
  }, [settle, drivers, beam8, beam7, hero, prompt, signRotate, signSlide]);

  function skipEntrance() {
    if (done) return;
    running.current?.stop();
    settle();
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
    }, [playEntrance]),
  );

  return (
    <Pressable style={styles.stage} onPress={skipEntrance} accessibilityLabel="Quiz stage">
      {/* Spotlight beams raking down from the top edge */}
      {/* One Svg per beam inside its own Animated.View, with the fade on the
          View rather than on the Path. Figma puts the opacity on the layer, so
          this mirrors the frame; it also keeps the animation on a plain view
          property, which behaves the same on native and web, instead of
          relying on Animated driving an SVG element's prop. */}
      {BEAMS.map((b, i) => (
        <Animated.View
          key={b.id}
          pointerEvents="none"
          style={[
            styles.beams,
            {
              opacity: (i === 0 ? beam8 : beam7).interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.83],
              }),
            },
          ]}
        >
          <Svg
            width={DESIGN_WIDTH * s}
            height={DESIGN_HEIGHT * s}
            viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
          >
            <Defs>
              <LinearGradient
                id={b.id}
                gradientUnits="userSpaceOnUse"
                x1={b.v.x1}
                y1={b.v.y1}
                x2={b.v.x2}
                y2={b.v.y2}
              >
                <Stop offset={b.at} stopColor={b.from} stopOpacity={1} />
                <Stop offset="1" stopColor={colors.stage} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {/* The translate lives on a G, not the Path, so the gradient's
                userSpaceOnUse coordinates resolve in the beam's own space —
                the same space the exported SVG defines them in. */}
            <G transform={`translate(${b.tx}, ${b.ty})`}>
              <Path d={b.d} fill={`url(#${b.id})`} />
            </G>
          </Svg>
        </Animated.View>
      ))}

      {/* The frame gives her two drop shadows, one thrown each way. RN caps a
          view at one shadow, and on an image with alpha only a silhouette
          shadow looks right — so web uses a two-stop drop-shadow filter. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: HERO.left * s,
            top: HERO.top * s,
            width: HERO.w * s,
            height: HERO.h * s,
            opacity: hero,
            transform: [
              {
                translateY: hero.interpolate({
                  inputRange: [0, 1],
                  outputRange: [T.hero.fromY * s, 0],
                }),
              },
            ],
            overflow: 'hidden',
          },
          HERO_SHADOW(s),
        ]}
        pointerEvents="none"
      >
        <Image
          source={quizmasterArt}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: HERO.w * s,
            height: HERO.h * s,
          }}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {/* Bottom wash to near-black (Figma "gradient overlay", y 469–855) */}
      <Svg style={styles.wash} width="100%" height="100%" pointerEvents="none">
        <Defs>
          {/* Fractions of the wash layer, which is the bottom 41.2% of the
              stage (y501–852) — not of the whole screen. So these land the
              fade at y522 and full black at y677. */}
          <LinearGradient id="wash" x1="0.721" y1="0.0597" x2="0.721" y2="0.5017">
            <Stop offset="0" stopColor={colors.stageDeep} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.stageDeep} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#wash)" />
      </Svg>

      {/* Headline blob (Figma Group 111) */}
      <Animated.View
        style={[
          styles.headingPanel,
          {
            left: 29 * s,
            top: 97 * s,
            width: 336 * s,
            height: 87 * s,
            transform: [
              {
                translateY: prompt.interpolate({
                  inputRange: [0, 1],
                  outputRange: [T.prompt.fromY * s, 0],
                }),
              },
            ],
          },
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

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateX: signSlide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [T.signSlide.fromX * s, 0],
                }),
              },
              {
                rotate: signRotate.interpolate({
                  // Figma swings it -20deg -> -7.88deg -> 0: a decaying settle
                  // rather than a straight tween, so the midpoint is kept.
                  inputRange: [0, 0.5, 1],
                  outputRange: [`${T.signRotate.from}deg`, `${T.signRotate.mid}deg`, '0deg'],
                }),
              },
            ],
            // Pivot at the foot of the pole (x81+6, y754) so the sign plants
            // into the ground instead of rotating about the screen's centre.
            transformOrigin: [`${87 * s}px`, `${BAR_TOP * s}px`, 0],
          },
        ]}
        pointerEvents="none"
      >
        {/* Pole, read off the Quiz/TypeSign component (2524:2875). It is two
            tones, not one: an 8-wide shaft carrying a vertical gradient from
            #F0C63D down to #D0A003, capped by a 12-wide rounded #F8E6A0 finial
            whose top 5px clear the signboard.

            That cap used to be a free-standing circle rendered outside the sign
            group and anchored to the tab-bar inset, while the pole was anchored
            to the design foot — so the two drifted apart, and the circle hung
            in mid-air on its own through the entrance. It belongs here, moving
            with the sign. */}
        <View
          style={{
            position: 'absolute',
            left: 81 * s,
            bottom: (DESIGN_H - 754) * s,
            width: 12 * s,
            height: 137 * s,
          }}
        >
          <Svg width={12 * s} height={137 * s} viewBox="0 0 12 137">
            <Defs>
              {/* Fitted to the component's own pixels: the shaft reads
                  #F0C63D at y80 and #D0A003 at its foot. Sampling above y80
                  picks up the signboard's gold edge overlapping the pole, not
                  the pole itself, which is what made a naive fit run too pale. */}
              <LinearGradient
                id="pole"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="80"
                x2="0"
                y2="137"
              >
                <Stop offset="0" stopColor="#F0C63D" />
                <Stop offset="1" stopColor="#D0A003" />
              </LinearGradient>
            </Defs>
            <Rect x="2" y="0" width="8" height="137" fill="url(#pole)" />
            <Rect x="0" y="0" width="12" height="12" rx="6" fill="#F8E6A0" />
          </Svg>
        </View>
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
            edgeFrom={colors.spotlight}
            edgeTo="#F7DA75"
            offsetX={SIGN_VIEW.dx}
            offsetY={SIGN_VIEW.dy}
          />
          <Text
            style={[
              styles.signText,
              { left: 28 * s, top: 27 * s, width: 90 * s, fontSize: 14 * s, lineHeight: 14 * s },
            ]}
          >
            Choose your quiz type
          </Text>
        </View>
      </Animated.View>

      {/* Mode fan with per-mode high-score badges */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={[styles.fanHost, { width: 394 * s }]} pointerEvents="box-none">
          {FAN_LAYOUT.map(({ mode, x, bottom }, i) => {
            const m = QUIZ_MODES[mode];
            const best = bestFor(mode);
            const spec = T.buttons[i];
            return (
              <Animated.View
                key={mode}
                style={[
                  styles.modeSlot,
                  { left: x * s, bottom: bottom * s, width: 65 * s },
                  chosen && chosen !== mode && styles.modeSlotDimmed,
                  {
                    opacity: btnFades[i],
                    transform: [
                      {
                        translateX: btns[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [spec.fromX * s, 0],
                        }),
                      },
                      {
                        translateY: btns[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [spec.fromY * s, 0],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents="box-none"
              >
                <View style={[styles.scoreBadge, { width: 40 * s, height: 19 * s }]}>
                  <Svg
                    width={FLAME.w * s}
                    height={FLAME.h * s}
                    viewBox={`0 0 ${FLAME.w} ${FLAME.h}`}
                  >
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
                  <ModeGlyph name={mode} s={s} color={colors.quizPurple} />
                </Pressable>
                <Text style={[styles.modeLabel, { marginTop: 5 * s, fontSize: 10 * s }]}>
                  {m.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    stage: {
      flex: 1,
      backgroundColor: colors.stage,
      overflow: 'hidden',
    },
    // Figma 1141:351: x0 y503, 393x352 — so it overhangs the 852 frame by 3 and
    // is clipped. Top-anchored at 503/852 rather than bottom-anchored, because
    // the gradient's own stops are fractions of a 352-tall box; pinning it to the
    // bottom made the box 349 and shifted them.
    wash: { position: 'absolute', left: 0, right: 0, top: '59.04%', height: '41.31%' },
    beams: { position: 'absolute', top: 0, alignSelf: 'center' },
    headingPanel: { position: 'absolute' },
    heading: {
      position: 'absolute',
      left: 0,
      right: 0,
      fontFamily: fonts.display,
      color: colors.onPrimary,
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
      color: colors.incorrectSoft,
    },
    modeCircle: {
      backgroundColor: colors.surface,
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
      backgroundColor: colors.surface,
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
      color: colors.incorrectSoft,
      textAlign: 'center',
    },
  });
