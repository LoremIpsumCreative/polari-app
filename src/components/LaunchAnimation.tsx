import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// The launch sequence — strapline, lockup assembly and the Open button popping
// in — as one continuous 7.09s animation.
//
// NATIVE half. The designer's file is an animated SVG whose motion lives in CSS
// @keyframes; react-native-svg has no CSS animation engine, so native plays a
// transparent video rendered from that same SVG instead. Both video files, and
// the settled still below, come out of scripts/build-launch-animation.mjs —
// re-run it after any re-export so the two platforms never drift apart.
//
// Alpha needs two codecs: HEVC (hvc1) for AVFoundation on iOS, VP9-in-WebM for
// Android. Neither engine reads the other's.
//
// The web half is LaunchAnimation.web.tsx, which plays the real vector file.
import { LAUNCH_ANIM_SIZE, LAUNCH_ANIM_MS } from './launchAnimationSvg';

const clip = require('../../assets/launch/startup.mov');
// The animation's last frame, rendered from the same SVG at the same size. A
// player is not obliged to hold its final frame once playback ends, so the
// still is swapped in on completion; being pixel-identical, the swap does not
// read.
const finalFrame = require('../../assets/launch/startup-final.png');

export { LAUNCH_ANIM_SIZE, LAUNCH_ANIM_MS };

// Deliberately NOT StyleSheet.absoluteFill. That fills by pinning all four
// edges while setting no width or height, which an <Image> on iOS resolves to
// nothing at all: it loaded, reported its 1185x1575, and drew zero pixels.
// Stating the size outright is what makes it paint.
const fill = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const;

export function LaunchAnimation({
  style,
  onEnd,
  settled = false,
}: {
  style?: StyleProp<ViewStyle>;
  onEnd?: () => void;
  /** Render the finished frame straight away — tap-to-skip and Reduce Motion. */
  settled?: boolean;
}) {
  const [done, setDone] = useState(false);

  const player = useVideoPlayer(clip, (p) => {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    if (settled) return;
    player.play();
  }, [player, settled]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      setDone(true);
      onEnd?.();
    });
    return () => sub.remove();
  }, [player, onEnd]);

  const showStill = settled || done;

  return (
    <View style={style} pointerEvents="none">
      {showStill ? (
        <Image source={finalFrame} style={fill} resizeMode="contain" />
      ) : (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="contain"
          nativeControls={false}
          // Android only, and required there: the default SurfaceView punches an
          // opaque hole through the view hierarchy, so a transparent clip shows
          // black instead of the screen behind it. iOS gets its transparency
          // from AVFoundation's own HEVC-alpha support and ignores this.
          surfaceType="textureView"
        />
      )}
    </View>
  );
}
