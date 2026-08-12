import { useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';

// Hold a screen behind its loading state until the artwork it is about to
// animate has actually been decoded.
//
// The problem this solves is specific: an <Image> mounts before its bitmap is
// ready, so an animation started on mount plays against a blank or half-painted
// frame. The present did exactly that — the box popped in partway through its
// own bounce. Waiting on the asset makes the first frame the whole picture.
//
// Asset.loadAsync resolves once each module is downloaded and cached. On native
// bundled images that is near-instant; on web it is the real fetch, which is
// where the race was visible.

type State = 'loading' | 'ready' | 'failed';

/**
 * Preload bundled image modules (the values `require()` returns).
 *
 * Pass a module-scope constant array, not an inline literal — a fresh array
 * every render would restart the load forever. The list is captured on first
 * run for that reason, so changing it later is deliberately ignored.
 */
export function useAssetsReady(modules: readonly number[]): State {
  const [state, setState] = useState<State>('loading');
  // Captured once: see above.
  const captured = useRef(modules);

  useEffect(() => {
    let live = true;
    Asset.loadAsync(captured.current as number[])
      .then(() => {
        if (live) setState('ready');
      })
      .catch(() => {
        // A decode failure must not strand the reader behind the veil forever.
        // The caller decides whether that means a retry or simply carrying on
        // with whatever the platform managed to paint.
        if (live) setState('failed');
      });
    return () => {
      live = false;
    };
  }, []);

  return state;
}
