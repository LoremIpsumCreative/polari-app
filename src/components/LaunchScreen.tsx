import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, DESIGN_WIDTH, DESIGN_HEIGHT } from '../lib/theme';
import { ScreenBackground } from './ScreenBackground';
import { useReducedMotion } from '../lib/reducedMotion';
import { useWallpapers } from '../lib/wallpapers';

const logo = require('../../assets/logo.png');

// ─────────────────────────────────────────────────────────────────────────────
// App launch, in two parts.
//
//   Begin (Figma 2992:3672, 6.28s) — "Discover the secret language of" pops in
//   word by word, the Polari title arrives on a big multi-bounce, the word group
//   fades away, and the four hero shapes slide up one at a time before the dark
//   Union settles over them.
//
//   End (2716:3149, 2s) — the finished lockup sits over a character wallpaper
//   with the Open button popping in.
//
// Both are authored as looping timelines in Figma, which is the tool's preview
// default; a launch sequence plays once and hands over. Percentages below are
// off each frame's own timeline so they read against the motion export.
//
// Figma repeats the Hero lockup three times in the end frame — stacked
// duplicates of the same artwork, not three separate things to draw.
// ─────────────────────────────────────────────────────────────────────────────

const BEGIN_MS = 6284.593;
const END_MS = 2000;

// The five words, with the fraction of the begin timeline at which each starts
// its pop. Every one runs the same shape: 0 -> 1.2 -> 0.97 -> 1 over ~13%.
const WORDS = [
  { text: 'Discover', at: 0.05555 },
  { text: 'the', at: 0.09583 },
  { text: 'secret', at: 0.13215 },
  { text: 'language', at: 0.16964 },
  { text: 'of', at: 0.20917 },
] as const;
const WORD_POP = { over: 0.05161, settle: 0.03871, rest: 0.03871 };

// The title's bounce is sampled every ~1.59% rather than eased, so the values
// are kept verbatim and interpolated.
const TITLE_STOPS = [
  0, 0.28641, 0.30233, 0.31824, 0.33415, 0.35006, 0.36597, 0.38189, 0.3978,
  0.41371, 0.42962, 0.44553, 0.46145, 0.47736, 0.49327, 0.50918, 0.52509,
  0.54101, 0.55692, 1,
];
const TITLE_SCALE = [
  0, 0, 0.034, 0.322, 0.923, 1.376, 1.5, 1.323, 1.007, 0.99, 1.143, 1.198,
  1.171, 1.129, 1.091, 1.062, 1.039, 1.022, 1.015, 1.015,
];

const WORDS_FADE = { from: 0.50368, to: 0.77208 };

const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** Interpolate a driver that runs 0..1 across the whole timeline. */
const between = (v: Animated.Value, from: number, to: number, out: [number, number]) =>
  v.interpolate({ inputRange: [0, from, to, 1], outputRange: [out[0], out[0], out[1], out[1]] });

export function LaunchScreen({ onOpen }: { onOpen: () => void }) {
  const begin = useRef(new Animated.Value(0)).current;
  const end = useRef(new Animated.Value(0)).current;
  const crossFade = useRef(new Animated.Value(0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const [phase, setPhase] = useState<'begin' | 'end'>('begin');
  const reduceMotion = useReducedMotion();
  const wallpapers = useWallpapers();
  const [paperIndex, setPaperIndex] = useState(0);

  /** Jump to the settled end screen — used by tap-to-skip and Reduce Motion. */
  const settle = useCallback(() => {
    running.current?.stop();
    running.current = null;
    begin.setValue(1);
    end.setValue(1);
    setPhase('end');
  }, [begin, end]);

  useEffect(() => {
    if (reduceMotion.current) {
      settle();
      return;
    }
    const seq = Animated.sequence([
      Animated.timing(begin, {
        toValue: 1,
        duration: BEGIN_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      Animated.timing(end, {
        toValue: 1,
        duration: END_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]);
    running.current = seq;
    // The end phase swaps in the wallpaper, so flip as the first leg lands.
    const t = setTimeout(() => setPhase('end'), BEGIN_MS);
    seq.start();
    return () => {
      clearTimeout(t);
      seq.stop();
    };
    // Deliberately mount-only: this is a launch sequence, not a focus effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-fade through the wallpapers while the end screen is up.
  useEffect(() => {
    if (phase !== 'end' || wallpapers.length < 2 || reduceMotion.current) return;
    const id = setInterval(() => {
      Animated.timing(crossFade, {
        toValue: 1,
        duration: 900,
        easing: EASE_IN_OUT,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        setPaperIndex((i) => (i + 1) % wallpapers.length);
        crossFade.setValue(0);
      });
    }, 4000);
    return () => clearInterval(id);
  }, [phase, wallpapers.length, crossFade, reduceMotion]);

  const next = wallpapers.length ? (paperIndex + 1) % wallpapers.length : 0;

  return (
    <View style={styles.screen}>
      <ScreenBackground />

      {/* Tap-to-skip is a sibling layer underneath the artwork, not a wrapper
          around it. Wrapping made the Open button a nested pressable, which on
          web is a <button> inside a <button> — invalid, and it confuses
          assistive tech about what is actually actionable. Everything above it
          is pointerEvents="none", so a tap anywhere else still reaches it. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={settle}
        accessibilityRole="button"
        accessibilityLabel="Skip the intro"
      />

      {/* Wallpaper carousel — only once the lockup has assembled. Two layers
          cross-fade so a change never flashes the canvas underneath. */}
      {phase === 'end' && wallpapers.length > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image source={{ uri: wallpapers[paperIndex] }} style={styles.paper} resizeMode="cover" />
          {wallpapers.length > 1 ? (
            <Animated.Image
              source={{ uri: wallpapers[next] }}
              style={[styles.paper, { opacity: crossFade }]}
              resizeMode="cover"
            />
          ) : null}
        </View>
      ) : null}

      {/* Phase 1: the strapline, popping word by word, then fading out. */}
      <Animated.View
        style={[styles.words, { opacity: between(begin, WORDS_FADE.from, WORDS_FADE.to, [1, 0]) }]}
        pointerEvents="none"
      >
        {WORDS.map((w) => (
          <Animated.Text
            key={w.text}
            style={[
              styles.word,
              {
                transform: [
                  {
                    scale: begin.interpolate({
                      inputRange: [
                        0,
                        w.at,
                        w.at + WORD_POP.over,
                        w.at + WORD_POP.over + WORD_POP.settle,
                        w.at + WORD_POP.over + WORD_POP.settle + WORD_POP.rest,
                        1,
                      ],
                      outputRange: [0, 0, 1.2, 0.97, 1, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {w.text}
          </Animated.Text>
        ))}
      </Animated.View>

      {/* The lockup ships as one flat asset (assets/logo.png), so the shapes,
          wordmark and dark outline stay exactly as drawn. It used to be
          recomposed here from the frame's separate shape paths plus the
          wordmark set in Mouse Memoirs, which did not match the real logo.
          The trade-off: the begin animation's staggered shape assembly is gone,
          because those shapes are baked into this asset — the lockup now
          arrives as a whole on the title's multi-bounce. */}
      <View style={styles.hero} pointerEvents="none">
        <Animated.Image
          source={logo}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              transform: [
                { scale: begin.interpolate({ inputRange: TITLE_STOPS, outputRange: TITLE_SCALE }) },
              ],
            },
          ]}
        />
      </View>

      {/* Phase 2: the Open button pops in over the finished lockup. */}
      <Animated.View
        style={[
          styles.openWrap,
          {
            transform: [
              {
                scale: end.interpolate({
                  inputRange: [0, 0.1745, 0.403, 0.5245, 0.646, 1],
                  outputRange: [0, 0, 1.2, 0.97, 1, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          onPress={onOpen}
          style={styles.open}
          accessibilityRole="button"
          accessibilityLabel="Open Polari"
        >
          <Text style={styles.openText}>Open</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas },
  paper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // The strapline sits above the lockup and reads as one stacked block.
  words: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DESIGN_HEIGHT * 0.22,
    alignItems: 'center',
  },
  word: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.text,
  },

  // Hero box 278x141, centred on the frame with a +115.5 vertical offset.
  // Centred on the frame's lockup centre (x196.5, y541.5). Height follows the
  // asset's own 570x315 aspect so nothing is squashed.
  hero: {
    position: 'absolute',
    left: (DESIGN_WIDTH - 278) / 2,
    top: DESIGN_HEIGHT / 2 + 115.5 - (278 * 315) / 570 / 2,
    width: 278,
    height: (278 * 315) / 570,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', height: '100%' },

  // continue button: y713, h50, radius 999, 2px #053876 under-edge.
  openWrap: { position: 'absolute', left: 0, right: 0, top: 713, alignItems: 'center' },
  open: {
    height: 50,
    paddingHorizontal: 70,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: '#053876',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },
});
