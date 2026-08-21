import { useWindowDimensions } from 'react-native';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PHONE_MAX_WIDTH } from './theme';

// Screens are Figma frames reproduced in the mockups' 393-wide space with
// absolutely positioned children, so there is still exactly one scale in the
// app and everything reads it. What changed is that the scale is now driven by
// WIDTH ALONE.
//
// It used to be min(width, height) — a uniform fit for a fixed-aspect drawing,
// which letterboxed. On any viewport proportionally wider than 393:852, and
// that is most phone browsers once the status bar is gone, the height term won
// and the app sat in a narrow column with dead canvas down both sides.
//
// Driving off width means the app fills the viewport horizontally and the frame
// takes the viewport's own height, so the tab bar — absolute, bottom: 0 — lands
// on the real bottom edge rather than the foot of a scaled drawing. Vertical
// overflow is each screen's own business, which is what the ScrollViews were
// always for.
//
// PHONE_MAX_WIDTH still caps it so a desktop window gets a phone-sized column
// rather than a stretched one.
export function designScale(width: number) {
  return Math.min(width, PHONE_MAX_WIDTH) / DESIGN_WIDTH;
}

export function useDesignScale() {
  const { width } = useWindowDimensions();
  return designScale(width);
}

/**
 * The app's box: the design's 393 width at its on-device size, centred
 * horizontally, and at least as tall as the 852-tall design.
 *
 * The height is max(viewport, designHeight), NOT the viewport alone. Screens
 * place their children absolutely down to y852, and the frame clips, so a
 * viewport shorter than the scaled design silently cut the foot off every
 * screen — on a 375x600 window the last 200-odd points, tab bar included, were
 * simply unreachable. The floor puts them back and lets the gutter scroll to
 * them.
 *
 * On anything at least as tall as the design — every phone in portrait, which
 * is the case that matters — the viewport still wins and nothing scrolls.
 *
 * `designHeight` is what 852 scales to on its own. Anchor to `height` to meet
 * the foot of the frame; use `designHeight` when reproducing a measurement
 * taken from the 852-tall mockup.
 */
// The design is 393x852, an aspect of 2.1679. A 375-wide viewport therefore
// wants 813 points of height, and a real iPhone 11/XR viewport is 812 — one
// point short. Without a tolerance that single point flips the whole app into
// scroll mode and pushes the tab bar below the fold on a device that fits it
// perfectly well. A viewport within this many points of the design counts as
// fitting.
const FIT_TOLERANCE = 2;

export function useDesignFrame() {
  const { width, height } = useWindowDimensions();
  const scale = designScale(width);
  const designHeight = DESIGN_HEIGHT * scale;
  // Genuinely too short — not merely a point or two shy of it.
  const overflows = designHeight - height > FIT_TOLERANCE;
  return {
    scale,
    width: DESIGN_WIDTH * scale,
    // When it fits, the frame takes the viewport exactly, so the tab bar meets
    // the glass. When it does not, the frame keeps the design's height and the
    // root scrolls to the rest.
    height: overflows ? designHeight : height,
    designHeight,
    overflows,
  };
}
