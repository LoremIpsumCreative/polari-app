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
 * horizontally, and the viewport's OWN height rather than a scaled 852. The tab
 * bar sits at bottom: 0 of this box, so it meets the physical bottom edge on
 * any screen without the app having to be a fixed-aspect drawing.
 *
 * `designHeight` is what 852 scales to. Screens that anchor something to the
 * foot of the frame want `height`; screens reproducing a measurement taken from
 * the 852-tall mockup want `designHeight`.
 */
export function useDesignFrame() {
  const { width, height } = useWindowDimensions();
  const scale = designScale(width);
  return {
    scale,
    width: DESIGN_WIDTH * scale,
    height,
    designHeight: DESIGN_HEIGHT * scale,
  };
}
