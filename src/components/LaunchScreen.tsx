import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import type { Palette } from '../lib/palette';
import { useThemedStyles } from '../lib/appearance';
import { useDesignScale } from '../lib/designScale';
import { LaunchAnimation, LAUNCH_ANIM_MS, LAUNCH_ANIM_SIZE } from './LaunchAnimation';
import { ScreenBackground } from './ScreenBackground';
import { useReducedMotion } from '../lib/reducedMotion';
import { useWallpapers } from '../lib/wallpapers';

// ─────────────────────────────────────────────────────────────────────────────
// App launch.
//
// One continuous animation, authored as a single file ("Startup Animation with
// Button.svg"): the strapline pops in word by word, resolves into the Polari
// lockup, and the Open button springs up under it. It used to be two Figma
// frames stitched together here with two JS timelines and a hand-built lockup
// bounce between them; all of that now lives in the export. See LaunchAnimation
// for how each platform plays it.
//
// What this file still owns is everything AROUND the animation:
//   · the sparkle canvas it plays over
//   · the wallpaper carousel, which fades up behind it once it finishes
//   · a real pressable over the Open button the animation draws
//   · tap-anywhere-to-skip
// ─────────────────────────────────────────────────────────────────────────────

// Where the animation's own 395x525 frame sits in the 393x852 design space.
//
// Solved from the artwork, not guessed. In the settled frame the lockup group
// measures x41.6 y244.3 w321.4 h172.3, so its centre is (202.3, 330.45).
// Landing that on the lockup centre the app has always used (196.5, 541.5)
// gives y = 541.5 - 330.45 = 211. The independently-rendered part-1 clip this
// replaces resolved to 213 by the same method, which is the cross-check that
// the placement is right.
//
// x is a plain centring: the export is 395 wide against a 393 frame, i.e. a 1px
// bleed down each side.
const FRAME = {
  w: LAUNCH_ANIM_SIZE.w,
  h: LAUNCH_ANIM_SIZE.h,
  x: (393 - LAUNCH_ANIM_SIZE.w) / 2,
  y: 211,
};

// The Open button the animation draws, measured off its settled frame
// (x111 y439.5 w175 h49 in the export's own units). Nothing is drawn here — a
// transparent pressable is laid over it, which is why these four numbers have
// to track the artwork. Re-measure if the export moves the button.
const BUTTON = { x: 111, y: 439.5, w: 175, h: 49 };

// How long the carousel takes to come up once the animation lands.
const PAPER_FADE_MS = 700;

export function LaunchScreen({ onOpen }: { onOpen: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const s = useDesignScale();
  const reduceMotion = useReducedMotion();
  const wallpapers = useWallpapers();

  // `settled` is the whole state machine now: false while the animation runs,
  // true once it has landed (played out, skipped, or never started because of
  // Reduce Motion). The Open button and the carousel both key off it.
  const [settled, setSettled] = useState(() => reduceMotion.current);
  const [paperIndex, setPaperIndex] = useState(0);

  const paperFade = useRef(new Animated.Value(0)).current;
  const crossFade = useRef(new Animated.Value(0)).current;

  const settle = useCallback(() => setSettled(true), []);

  // Safety net. The animation reports its own completion — a timer on web, the
  // player's playToEnd on native — but a decode failure, a blocked autoplay or
  // a missing asset would report nothing at all, and the launch screen is the
  // one screen that must never become a dead end.
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(settle, LAUNCH_ANIM_MS + 1500);
    return () => clearTimeout(t);
  }, [settled, settle]);

  // The carousel fades up behind the finished lockup rather than cutting in.
  useEffect(() => {
    if (!settled || wallpapers.length === 0) return;
    if (reduceMotion.current) {
      paperFade.setValue(1);
      return;
    }
    const anim = Animated.timing(paperFade, {
      toValue: 1,
      duration: PAPER_FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [settled, wallpapers.length, paperFade, reduceMotion]);

  // Cross-fade between wallpapers for as long as the launch screen is up.
  useEffect(() => {
    if (!settled || wallpapers.length < 2 || reduceMotion.current) return;
    const id = setInterval(() => {
      Animated.timing(crossFade, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        setPaperIndex((i) => (i + 1) % wallpapers.length);
        crossFade.setValue(0);
      });
      // 8s apart: the cross-fade is 900ms, so each wallpaper holds about seven
      // seconds before the next starts arriving.
    }, 8000);
    return () => clearInterval(id);
  }, [settled, wallpapers.length, crossFade, reduceMotion]);

  const next = wallpapers.length ? (paperIndex + 1) % wallpapers.length : 0;

  return (
    <View style={styles.screen}>
      <ScreenBackground />

      {/* Tap-to-skip is a sibling layer underneath the artwork, not a wrapper
          around it. Wrapping made the Open button a nested pressable, which on
          web is a <button> inside a <button> — invalid, and it confuses
          assistive tech about what is actually actionable. Everything above it
          is pointerEvents="none" bar the Open button itself, so a tap anywhere
          else still reaches it. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={settle}
        accessibilityRole="button"
        accessibilityLabel="Skip the intro"
      />

      {/* The carousel, fading up once the animation lands. Two layers so a
          change never flashes the canvas underneath.

          This stays mounted from the start and hides behind opacity 0 rather
          than being added to the tree when `settled` flips. Mounting it late
          inserted a sibling ahead of the animation and, on iOS, left the
          wallpaper painting over the finished lockup instead of behind it —
          the layers below carry explicit zIndex for the same reason. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.paperLayer, { opacity: paperFade }]}
        pointerEvents="none"
      >
        {wallpapers.length > 0 ? (
          <Image source={{ uri: wallpapers[paperIndex] }} style={styles.paper} resizeMode="cover" />
        ) : null}
        {wallpapers.length > 1 ? (
          <Animated.Image
            source={{ uri: wallpapers[next] }}
            style={[styles.paper, { opacity: crossFade }]}
            resizeMode="cover"
          />
        ) : null}
      </Animated.View>

      <LaunchAnimation
        style={[
          styles.animation,
          { left: FRAME.x * s, top: FRAME.y * s, width: FRAME.w * s, height: FRAME.h * s },
        ]}
        onEnd={settle}
        settled={settled}
      />

      {/* The Open button is drawn by the animation; this is the hit target over
          it. It carries no visuals of its own — anything drawn here would have
          to be kept in sync with the artwork by hand, and would double up on it
          the moment the export changed. It only becomes live once the animation
          has finished revealing the button underneath. */}
      {settled ? (
        <Pressable
          onPress={onOpen}
          style={[
            styles.openHit,
            {
              left: (FRAME.x + BUTTON.x) * s,
              top: (FRAME.y + BUTTON.y) * s,
              width: BUTTON.w * s,
              height: BUTTON.h * s,
              borderRadius: (BUTTON.h * s) / 2,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open Polari"
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.canvas,
    },
    paper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
    },

    // Explicit stacking. Sibling order alone is enough on web, but on iOS a
    // late-mounted absolute sibling can end up painting over one declared before
    // it — which put the wallpaper on top of the finished lockup. These make the
    // order the code intends the order that renders.
    paperLayer: { zIndex: 1 },
    // Placed and sized at the call site from FRAME.
    animation: { position: 'absolute', zIndex: 2 },
    openHit: { position: 'absolute', zIndex: 3 },
  });
