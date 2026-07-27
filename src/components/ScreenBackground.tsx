import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { colors } from '../lib/theme';
import { SPARKLE_TILE_PATH } from './sparkleTilePath';

// The sparkle texture behind every screen — the design system's "Background
// Pattern" (node 2257:12467) repeated at its native tile size. It sits under
// everything and never takes touches.
const TILE_W = 269;
const TILE_H = 170.887;
const SPARKLE_INK = '#DBDDE4';
const SPARKLE_OPACITY = 0.7;

export function ScreenBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.canvas]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="polari-sparkles"
            patternUnits="userSpaceOnUse"
            width={TILE_W}
            height={TILE_H}
          >
            <Path
              d={SPARKLE_TILE_PATH}
              fill={SPARKLE_INK}
              fillOpacity={SPARKLE_OPACITY}
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#polari-sparkles)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: colors.canvas,
    // A negative index paints the pattern above the parent's own background
    // fill but below every child. Without it the absolutely positioned layer
    // paints over in-flow content that isn't itself positioned — RN-web gives
    // View and Text `position: relative`, but a TextInput's bare <input> gets
    // nothing, so search fields vanished behind the canvas.
    zIndex: -1,
  },
});
