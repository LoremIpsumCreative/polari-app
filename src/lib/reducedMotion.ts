import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The device's "Reduce Motion" setting, kept live.
 *
 * Returns a ref, not state, and that is deliberate. An entrance or loop is
 * normally kicked off from a focus effect, and the callback that starts it
 * has to keep a stable identity: if reading this flag re-rendered and gave the
 * callback a new identity, the focus effect would re-run and its cleanup would
 * stop the animation part-way through. A ref lets the value change without
 * disturbing anything that depends on it.
 *
 * Read it at the moment you start an animation — `reduceMotion.current` — and
 * present the finished state instead of playing, rather than playing the same
 * movement faster. On web this resolves from the prefers-reduced-motion media
 * query, so it can be exercised with Chrome's media emulation.
 */
export function useReducedMotion() {
  const reduceMotion = useRef(false);

  useEffect(() => {
    let alive = true;
    const set = (on: boolean) => {
      if (alive) reduceMotion.current = on;
    };
    AccessibilityInfo.isReduceMotionEnabled().then(set);
    // It can be toggled from Control Centre while the app is open.
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', set);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
