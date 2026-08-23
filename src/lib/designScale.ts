import { useWindowDimensions } from 'react-native';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PHONE_MAX_WIDTH } from './theme';

// Screens are Figma frames reproduced in the mockups' 393x852 space. Documents
// — Account, Dictionary — lay themselves out in flow inside that box; composed
// screens — the quiz stage, the Collections hub, the gates — pin artwork and
// controls to points on it. Both need the box to be a known size, and there is
// exactly ONE scale in the app so nothing can drift out of register.
//
// The scale is a uniform fit: shrink the design until the whole of it fits the
// window, on BOTH axes. Consequences, all of them wanted:
//
//   Nothing ever clips. A composed screen cannot lose its title off the top or
//   its tab bar off the bottom, whatever shape the window is.
//
//   Nothing ever scrolls at the frame level. Screens still scroll their own
//   content; the frame itself always fits.
//
//   The full 393x852 is always present. "Minimum resolution" is maintained by
//   construction — the design is never cropped, only drawn smaller.
//
// The cost is a letterbox wherever the window's aspect differs from 2.168:1,
// and on a real phone that is fractions of a pixel: a 375x812 viewport fits at
// 0.9531 against a width term of 0.9542. It is only visible on window shapes no
// handset has.
//
// PHONE_MAX_WIDTH caps the width term so a wide desktop window gets a
// phone-sized column rather than a stretched one.
export function designScale(width: number, height: number) {
  return Math.min(Math.min(width, PHONE_MAX_WIDTH) / DESIGN_WIDTH, height / DESIGN_HEIGHT);
}

export function useDesignScale() {
  const { width, height } = useWindowDimensions();
  return designScale(width, height);
}

/**
 * The design's 393x852 frame at its on-device size. The root draws the app into
 * exactly this box: centred horizontally and anchored to the BOTTOM, so the tab
 * bar — which the frames put at y751-852 — lands on the physical bottom edge
 * whenever the height term binds, and any vertical slack falls at the top,
 * into the status-bar strip the frames leave empty.
 *
 * Because the fit is uniform the box always has the design's own aspect, so
 * `height` IS the scaled 852. There is no separate `designHeight` to reconcile
 * and nothing overflows.
 */
export function useDesignFrame() {
  const { width, height } = useWindowDimensions();
  const scale = designScale(width, height);
  return { scale, width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale };
}
