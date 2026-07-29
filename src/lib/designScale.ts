import { useWindowDimensions } from 'react-native';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PHONE_MAX_WIDTH } from './theme';

// Screens that place everything absolutely in the mockups' 393x852 space scale
// by the device. Scaling on width alone overflows a wide-but-short window — at
// 429x859 the design becomes 928 tall and the bottom 69px (the results screen's
// Finish pill, for one) falls off the end. Fitting both axes keeps the whole
// frame on screen.
//
// The height term uses the column's own minimum rather than the raw viewport,
// so a short window still scrolls the full-size design instead of shrinking it.
export function useDesignScale() {
  const { width, height } = useWindowDimensions();
  return Math.min(
    Math.min(width, PHONE_MAX_WIDTH) / DESIGN_WIDTH,
    Math.max(height, DESIGN_HEIGHT) / DESIGN_HEIGHT
  );
}
