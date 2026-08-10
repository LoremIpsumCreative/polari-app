import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import { useReducedMotion } from '../lib/reducedMotion';
import { useDesignScale } from '../lib/designScale';

// The lid coming off today's present — the designer's "New Word Opened"
// animation, rebuilt from its exported layers.
//
// Two layers and one moving part, so this is Animated rather than a rendered
// video: the box sits still while the lid drifts up and to the right and stays
// there. It plays once and holds — the looping in the export is Figma's preview
// running the timeline round again, not the beat this is meant to give.

const baseArt = require('../../assets/present-open-base.png');
const lidArt = require('../../assets/present-open-lid.png');

// The exported composite, and where it lands in the 393x852 frame.
//
// NOTE: the Figma node for "Today/New Word Opened" (3360:5432) holds only the
// background and the navbar — the present layers are not in it — so this offset
// is derived rather than read off the design: the composite's width matches the
// static "New Word Opened" export exactly at scale 1, which fixes x, and y then
// comes from aligning the box's base with that same export. Worth confirming
// against the real node if one turns up.
const COMPOSITE = { left: 5.5, top: 202.5, width: 370, height: 403 };

const BASE = { left: 0, top: 196.88, width: 369.059, height: 202 };

// Figma rotates the lid about the rect's top-left, not its centre — the export
// pairs `transform-origin: 0 0` with `translate(140.036, 58) rotate(18.8271)`.
// RN turns about a view's centre, so the rotation is wrapped in a translate out
// to the corner and back, and `LID_PIVOT` is that corner relative to the centre.
const LID = { left: 140.036, top: 58, width: 226.621, height: 109.035, rotation: '18.8271deg' };
const LID_PIVOT = { x: -LID.width / 2, y: -LID.height / 2 };

// The drift, in the frame's own axes rather than the lid's: the export applies
// it before the rotation, so the lid travels straight up-and-right whatever
// angle it sits at.
const LID_TRAVEL = { x: 40, y: -40 };

// The lid reaches its resting place 67.52% into the export's 2s timeline and
// holds for the rest, so the movement itself is 1350ms.
const OPEN_MS = 1350;

export function PresentOpenAnimation({
  onEnd,
  style,
}: {
  /** Fired once the lid has settled — the cue to move on to the word. */
  onEnd?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useDesignScale();
  const reduceMotion = useReducedMotion();
  const open = useRef(new Animated.Value(0)).current;
  // Kept in a ref so a caller that passes an inline arrow doesn't restart the
  // animation on every render. Synced in its own effect, declared first so it
  // has landed before the one below reads it.
  const ended = useRef(onEnd);
  useEffect(() => {
    ended.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    // Reduce Motion: the lid is simply already off. The beat still happens, so
    // the screen moves on at the same point in the sequence.
    if (reduceMotion.current) {
      open.setValue(1);
      ended.current?.();
      return;
    }
    open.setValue(0);
    const run = Animated.timing(open, {
      toValue: 1,
      duration: OPEN_MS,
      // CSS ease-out, which is what the export names.
      easing: Easing.bezier(0, 0, 0.58, 1),
      useNativeDriver: false,
    });
    run.start(({ finished }) => {
      if (finished) ended.current?.();
    });
    return () => run.stop();
  }, [open, reduceMotion]);

  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: COMPOSITE.left * s,
          top: COMPOSITE.top * s,
          width: COMPOSITE.width * s,
          height: COMPOSITE.height * s,
        },
        style,
      ]}
    >
      <Animated.Image
        source={baseArt}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        style={{
          position: 'absolute',
          left: BASE.left * s,
          top: BASE.top * s,
          width: BASE.width * s,
          height: BASE.height * s,
        }}
      />
      <Animated.Image
        source={lidArt}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        style={{
          position: 'absolute',
          left: LID.left * s,
          top: LID.top * s,
          width: LID.width * s,
          height: LID.height * s,
          transform: [
            {
              translateX: open.interpolate({
                inputRange: [0, 1],
                outputRange: [0, LID_TRAVEL.x * s],
              }),
            },
            {
              translateY: open.interpolate({
                inputRange: [0, 1],
                outputRange: [0, LID_TRAVEL.y * s],
              }),
            },
            { translateX: LID_PIVOT.x * s },
            { translateY: LID_PIVOT.y * s },
            { rotate: LID.rotation },
            { translateX: -LID_PIVOT.x * s },
            { translateY: -LID_PIVOT.y * s },
          ],
        }}
      />
    </View>
  );
}
