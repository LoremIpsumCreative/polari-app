import { useWindowDimensions } from 'react-native';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PHONE_MAX_WIDTH } from './theme';

// Every screen is a Figma frame reproduced in the mockups' 393x852 space with
// absolutely positioned children, so the whole app is one fixed-aspect drawing.
// A fixed-aspect drawing has exactly one honest way to meet an arbitrary
// device: scale it uniformly until it fits, and let the leftover show as
// canvas. That is what this returns, and it is the ONLY scale in the app —
// screens, the tab bar and the launch sequence all read it, so nothing can
// drift out of register with anything else.
//
// The height term used to be `Math.max(height, DESIGN_HEIGHT) / DESIGN_HEIGHT`,
// which is >= 1 by construction and so never actually constrained anything. A
// viewport shorter than 852 — every iPhone running this in Safari with its
// chrome showing, and most of them running it from the home screen — laid the
// design out at full size inside a column pinned to a 852 minimum and scrolled
// the overflow. The tab bar sits at the foot of that column, so it fell below
// the fold: the reported "navbar isn't sticking to the bottom".
//
// The width term keeps the PHONE_MAX_WIDTH cap so a desktop browser window gets
// a phone-sized column rather than a stretched one. On a real handset the height
// term is what binds anyway — a phone's web viewport loses the status bar and is
// therefore proportionally wider than the 393:852 frame — so the cap costs
// nothing on device.
export function designScale(width: number, height: number) {
  return Math.min(Math.min(width, PHONE_MAX_WIDTH) / DESIGN_WIDTH, height / DESIGN_HEIGHT);
}

export function useDesignScale() {
  const { width, height } = useWindowDimensions();
  return designScale(width, height);
}

/**
 * The design's 393x852 frame at its on-device size. The root layout draws the
 * app into exactly this box: centred horizontally, and flush with the BOTTOM of
 * the viewport so the tab bar — which the frames put at y751-852 — always lands
 * on the physical bottom edge. Any vertical slack (a viewport proportionally
 * taller than the frame) falls at the top, into the status-bar strip the frames
 * leave empty anyway.
 */
export function useDesignFrame() {
  const { width, height } = useWindowDimensions();
  const scale = designScale(width, height);
  return { scale, width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale };
}
