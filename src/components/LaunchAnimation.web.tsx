import { createElement, memo, useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { LAUNCH_ANIM_MS, LAUNCH_ANIM_SIZE, LAUNCH_ANIM_SVG } from './launchAnimationSvg';

// WEB half of LaunchAnimation — see that file for the platform split.
//
// Web plays the designer's animated SVG itself: vector, so it is sharp at every
// density, and the motion is the export's own CSS rather than a re-render of
// it. The build script has already turned the export's `infinite` loop into
// `1 forwards`, so it runs once and holds its final frame — which is why there
// is no separate still to swap in here.
//
// react-native-web renders through React DOM, so a DOM node in the tree is
// legitimate; `createElement` avoids needing DOM JSX typings in a native
// project's tsconfig.

export { LAUNCH_ANIM_SIZE, LAUNCH_ANIM_MS };

// The markup is injected imperatively, once, and this component takes no props
// — so React has no reason to ever touch the subtree again.
//
// It was originally a plain `dangerouslySetInnerHTML`, which looks equivalent
// and is not: something in the re-render path was recreating the node, and a
// recreated node means brand-new CSS animations, which start from zero. The
// symptom was the finished lockup dissolving back into the strapline about
// eight seconds after it settled — the launch screen's own carousel tick
// re-rendering its parent. Owning the DOM directly makes that impossible.
const SvgHost = memo(function SvgHost() {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || el.firstChild) return;
    // The markup is generated at build time from a file in this repo, not from
    // user input or the network.
    el.innerHTML = LAUNCH_ANIM_SVG;
  }, []);

  return createElement('div', {
    ref: host,
    style: { width: '100%', height: '100%' },
  });
});

/** Seek every animation in the subtree to its final frame and hold it. */
function freeze(root: HTMLElement | null) {
  if (!root || typeof root.getAnimations !== 'function') return;
  for (const a of root.getAnimations({ subtree: true })) {
    const d = Number(a.effect?.getTiming().duration ?? 0);
    // A hair inside the end: at exactly `duration` some engines report the
    // animation as wrapped rather than finished.
    a.currentTime = Math.max(0, d - 0.5);
    a.pause();
  }
}

export function LaunchAnimation({
  style,
  onEnd,
  settled = false,
}: {
  style?: StyleProp<ViewStyle>;
  onEnd?: () => void;
  /** Jump to the finished frame — tap-to-skip and Reduce Motion. */
  settled?: boolean;
}) {
  const wrap = useRef<View | null>(null);

  // Completion is taken from the known duration rather than an `animationend`
  // listener: the file runs 17 animations, so the event fires 17 times at
  // several different moments, and the last one to land is not necessarily the
  // one that matters.
  useEffect(() => {
    if (settled || !onEnd) return;
    const t = setTimeout(onEnd, LAUNCH_ANIM_MS);
    return () => clearTimeout(t);
  }, [settled, onEnd]);

  // Skipping lands on exactly the frame `1 forwards` would have held anyway.
  useEffect(() => {
    if (!settled) return;
    freeze(wrap.current as unknown as HTMLElement | null);
  }, [settled]);

  return (
    <View ref={wrap} style={style} pointerEvents="none">
      <SvgHost />
    </View>
  );
}
