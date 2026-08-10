import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../lib/reducedMotion';
import { useDesignScale } from '../lib/designScale';
import { colors, fonts } from '../lib/theme';

// The app's two global load states — Figma "Global/Loading" (3304:3234) and
// "Global/Load Fail" (3335:3635).
//
// Both are a scrim over whatever the screen was already showing, so they read
// as a veil drawn across the app rather than a separate page. Callers put their
// own background behind; these components paint only the veil and its contents.
//
// The designer's file is an animated SVG whose motion lives in CSS @keyframes,
// which react-native-svg cannot run. Unlike the launch sequence — which needed a
// rendered video because half a dozen layers move at once — every track here is
// a plain rotate or translate, so the motion is rebuilt with Animated and the
// artwork is just the exported PNG layers. One implementation covers native and
// web, and there is no video to re-render when the art changes.

const clockBody = require('../../assets/loading/clock-body.png');
const clockHourHand = require('../../assets/loading/clock-hour-hand.png');
const clockSecondHand = require('../../assets/loading/clock-second-hand.png');
const clockHandBase = require('../../assets/loading/clock-hand-base.png');
const clockBroken = require('../../assets/loading/clock-broken.png');

// #121212 at 50% over a 3.5px backdrop blur ("background blur", Figma blur
// radius 7 — CSS takes half). The scrim carries the effect; the blur only
// softens whatever sits under it, which is why native going without it reads as
// slightly crisper rather than wrong. Same trade the tab bar's blur pane makes.
const SCRIM = 'rgba(18, 18, 18, 0.5)';
const BLUR_RADIUS = 3.5;

// Deliberately not StyleSheet.absoluteFill, for the reason LaunchAnimation
// spells out: that pins all four edges without setting width or height, which
// an <Image> on iOS resolves to nothing at all. Stating the size makes it paint.
const FILL = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const;

// One cycle of the loading loop. Every track below is a fraction of it.
const CYCLE_MS = 5254;

// Both headlines are trimmed to the cap line in Figma (text-box-edge: cap
// alphabetic), so the design's `top` is where the capitals begin, not where the
// line box does. RN has no text-box-trim, and the gap between the two is
// half-leading + ascent - cap height: 3.96 for Mouse Memoirs at 36/32.4,
// measured off the rendered font. Subtracting it lands the capitals on the
// design's line instead of ~4px below it.
const HEADLINE_SIZE = 36;
const HEADLINE_LINE_HEIGHT = 32.4; // 36 x 0.9
const CAP_INSET = 3.96;
const LOADING_CAP_TOP = 310; // group at y298 + 12
const FAILED_CAP_TOP = 341;

// Clock, in the 393x852 design frame. The group sits at (138.97, 298) and the
// clock within it at (13.03, 69); these are the sums, so the layers can be
// positioned without a nested wrapper.
const CLOCK = { left: 152.0, top: 367, width: 91.937, height: 113 };

// Both hands turn about the same point — the centre of the little cap that
// covers the spindle. Figma exports that as a rotation about each hand's own
// centre plus a translate tracing a circle; solving the two together recovers
// the single pivot, and `pivotOffset` is the vector from the layer's centre to
// it. Rotating about an offset point is translate → rotate → translate back,
// which RN composes left-to-right exactly as CSS does.
const HOUR_HAND = {
  left: 31.4919,
  top: 49.3267,
  width: 14.4044,
  height: 10.3167,
  pivotOffset: { x: 7.27, y: 5.16 },
};
const SECOND_HAND = {
  left: 46.0269,
  top: 44.8131,
  width: 21.66,
  height: 14.8302,
  pivotOffset: { x: -10.905, y: 7.415 },
};
const HAND_BASE = { left: 42.9583, top: 55.4522, width: 6.24953, height: 6.44793 };

// The hour hand takes the whole cycle to go round once, anticlockwise; the
// second hand laps it three times the other way. Figma writes the second hand's
// reset as a 0.038% snap rather than a jump, and keeping that keeps the two in
// the phase the designer saw.
const SECOND_HAND_LAPS = [0, 0.33308, 0.33346, 0.66654, 0.66692, 1];
const SECOND_HAND_ANGLES = ['0rad', '6.283rad', '0rad', '6.283rad', '0rad', '6.283rad'];

// The wordmark bobs twice per cycle. Figma bakes the easing into samples taken
// every ~100ms and plays them linear, so interpolating the table reproduces the
// curve exactly rather than approximating it with a bezier — the same treatment
// the present's bounce gets on the Today screen.
const BOB = {
  stops: [
    0, 0.01903, 0.03807, 0.0571, 0.07613, 0.09517, 0.1142, 0.13323, 0.15226, 0.1713, 0.19033,
    0.20936, 0.2284, 0.24743, 0.26646, 0.2855, 0.30453, 0.32356, 0.3426, 0.36163, 0.38066, 0.3997,
    0.41873, 0.43776, 0.45679, 0.47583, 0.49486, 0.51389, 0.53293, 0.55196, 0.57099, 0.59003,
    0.60906, 0.62809, 0.64713, 0.66616, 0.68519, 0.70423, 0.72326, 0.74229, 0.76132, 0.78036,
    0.79939, 0.81842, 0.83746, 0.85649, 0.87552, 0.89456, 0.91359, 0.93262, 0.95166, 0.97069,
    0.98972, 1,
  ],
  y: [
    0, -1.178, -2.282, -3.328, -4.316, -5.246, -6.116, -6.921, -7.656, -8.314, -8.885, -9.358,
    -9.717, -9.882, -8.769, -7.667, -6.625, -5.639, -4.712, -3.845, -3.043, -2.311, -1.657, -1.09,
    -0.623, -0.27, -0.186, -1.3, -2.398, -3.437, -4.419, -5.343, -6.206, -7.004, -7.731, -8.38,
    -8.941, -9.402, -9.748, -9.629, -8.521, -7.432, -6.402, -5.429, -4.515, -3.662, -2.875, -2.16,
    -1.524, -0.978, -0.534, -0.209, -0.028, 0,
  ],
};

/** The veil both states sit on. */
function Scrim({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.scrim} pointerEvents="box-none">
      {children}
    </View>
  );
}

/**
 * Global/Loading — the clock winds while the wordmark bobs, on a 5.254s loop.
 *
 * Reduce Motion stops the loop and shows the clock at rest, which is the whole
 * picture minus the movement; a looping animation never ends on its own, so it
 * is the clearest case for honouring the setting.
 */
export function LoadingScreen() {
  const s = useDesignScale();
  const reduceMotion = useReducedMotion();
  const cycle = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion.current) return;
    cycle.setValue(0);
    const loop = Animated.loop(
      Animated.timing(cycle, {
        toValue: 1,
        duration: CYCLE_MS,
        // Linear on purpose: the easing already lives in the sampled values.
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    running.current = loop;
    loop.start();
    return () => {
      loop.stop();
      running.current = null;
    };
  }, [cycle, reduceMotion]);

  // A hand is placed by its own rect, then spun about the shared pivot.
  const hand = (
    layer: typeof HOUR_HAND,
    source: number,
    rotate: Animated.AnimatedInterpolation<string>,
  ) => {
    const dx = layer.pivotOffset.x * s;
    const dy = layer.pivotOffset.y * s;
    return (
      <Animated.Image
        source={source}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        style={{
          position: 'absolute',
          left: layer.left * s,
          top: layer.top * s,
          width: layer.width * s,
          height: layer.height * s,
          transform: [
            { translateX: dx },
            { translateY: dy },
            { rotate },
            { translateX: -dx },
            { translateY: -dy },
          ],
        }}
      />
    );
  };

  return (
    <Scrim>
      <View
        style={styles.fill}
        pointerEvents="none"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      >
        <Animated.Text
          style={[
            styles.headline,
            {
              top: (LOADING_CAP_TOP - CAP_INSET) * s,
              fontSize: HEADLINE_SIZE * s,
              lineHeight: HEADLINE_LINE_HEIGHT * s,
              transform: [
                {
                  translateY: cycle.interpolate({
                    inputRange: [...BOB.stops],
                    outputRange: BOB.y.map((v) => v * s),
                  }),
                },
              ],
            },
          ]}
        >
          Loading
        </Animated.Text>

        <View
          style={{
            position: 'absolute',
            left: CLOCK.left * s,
            top: CLOCK.top * s,
            width: CLOCK.width * s,
            height: CLOCK.height * s,
          }}
        >
          <Image
            source={clockBody}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
            style={styles.fill}
          />
          {hand(
            HOUR_HAND,
            clockHourHand,
            cycle.interpolate({ inputRange: [0, 1], outputRange: ['0rad', '-6.283rad'] }),
          )}
          {hand(
            SECOND_HAND,
            clockSecondHand,
            cycle.interpolate({
              inputRange: [...SECOND_HAND_LAPS],
              outputRange: [...SECOND_HAND_ANGLES],
            }),
          )}
          {/* Drawn last: the cap sits over the spindle both hands turn on. */}
          <Image
            source={clockHandBase}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
            style={{
              position: 'absolute',
              left: HAND_BASE.left * s,
              top: HAND_BASE.top * s,
              width: HAND_BASE.width * s,
              height: HAND_BASE.height * s,
            }}
          />
        </View>
      </View>
    </Scrim>
  );
}

/**
 * Global/Load Fail — the same veil, a clock that has thrown its gears, and the
 * way back. Nothing moves here: the state is already the end of a story.
 */
export function LoadFailedScreen({ onRetry }: { onRetry: () => void }) {
  const s = useDesignScale();
  const retry = useCallback(() => onRetry(), [onRetry]);

  return (
    <Scrim>
      <Text
        style={[
          styles.headline,
          {
            top: (FAILED_CAP_TOP - CAP_INSET) * s,
            fontSize: HEADLINE_SIZE * s,
            lineHeight: HEADLINE_LINE_HEIGHT * s,
          },
        ]}
        accessibilityRole="alert"
      >
        Couldn&apos;t load
      </Text>

      <Image
        source={clockBroken}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{
          position: 'absolute',
          left: 145 * s,
          top: 425 * s,
          width: 105 * s,
          height: 128 * s,
        }}
      />

      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Refresh"
        style={({ pressed }) => [
          styles.refresh,
          {
            top: 608 * s,
            height: 50 * s,
            borderRadius: 999 * s,
            borderWidth: 2 * s,
            paddingHorizontal: 70 * s,
          },
          pressed && styles.refreshPressed,
        ]}
      >
        <Text style={[styles.refreshLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
          Refresh
        </Text>
      </Pressable>
    </Scrim>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...FILL,
    backgroundColor: SCRIM,
    alignItems: 'center',
    // backdropFilter is a web-only CSS property; native would need expo-blur,
    // and the 50% scrim already does the work the blur only softens.
    ...Platform.select({
      web: { backdropFilter: `blur(${BLUR_RADIUS}px)` } as object,
      default: {},
    }),
  },
  fill: { ...FILL },
  headline: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.onPrimary,
  },
  refresh: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  refreshPressed: { opacity: 0.7 },
  refreshLabel: {
    fontFamily: fonts.bold,
    color: colors.primary,
    textAlign: 'center',
  },
});
