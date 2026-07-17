import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../lib/theme';

// The torn-ribbon banner behind the end-of-quiz headline. Two skewed quads —
// paths and transforms lifted verbatim from the Figma vectors (Rectangle 50 /
// Rectangle 51), so it scales crisply instead of shipping three PNGs.
export type BannerVariant = 'highScore' | 'timesUp' | 'results';

const DESIGN_WIDTH = 394;
const BANNER_HEIGHT = 190; // design units; the ribbon occupies y 66..177
const TITLE_CENTRE_Y = 123.5; // midpoint of the two quads

type Shape = { d: string; matrix: string };

const GOLD_SHAPES: Shape[] = [
  { d: 'M6.94327 0 L252 24.0282 L245.874 92.4476 L0 101 L6.94327 0 Z', matrix: 'matrix(1,0,0,1,56,70)' },
  { d: 'M10.441 6.61055 L242.239 0 L250 83.5582 L0 101 L10.441 6.61055 Z', matrix: 'matrix(-1,0,0,-1,337,177)' },
];
// Time's Up and Results share one (slightly wider) ribbon geometry.
const WIDE_SHAPES: Shape[] = [
  { d: 'M7.1637 0 L260 24.7419 L253.679 95.1935 L0 104 L7.1637 0 Z', matrix: 'matrix(1,0,0,1,52,66)' },
  { d: 'M10.7751 6.8069 L249.99 0 L258 86.0402 L0 104 L10.7751 6.8069 Z', matrix: 'matrix(-1,0,0,-1,341,176)' },
];

const VARIANTS: Record<BannerVariant, { shapes: Shape[]; fill: string; ink: string }> = {
  highScore: { shapes: GOLD_SHAPES, fill: '#E2B203', ink: '#3D3102' },
  timesUp: { shapes: WIDE_SHAPES, fill: '#9F8FEF', ink: '#2B273F' },
  results: { shapes: WIDE_SHAPES, fill: '#94C748', ink: '#28311B' },
};

export function QuizResultBanner({ variant, title }: { variant: BannerVariant; title: string }) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width, 420) / DESIGN_WIDTH;
  const { shapes, fill, ink } = VARIANTS[variant];

  return (
    <View style={{ width: DESIGN_WIDTH * scale, height: BANNER_HEIGHT * scale }}>
      <Svg
        width={DESIGN_WIDTH * scale}
        height={BANNER_HEIGHT * scale}
        viewBox={`0 0 ${DESIGN_WIDTH} ${BANNER_HEIGHT}`}
      >
        {shapes.map((s) => (
          <Path key={s.matrix} d={s.d} transform={s.matrix} fill={fill} />
        ))}
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.titleWrap,
          { transform: [{ translateY: (TITLE_CENTRE_Y - BANNER_HEIGHT / 2) * scale }] },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.title, { color: ink, fontSize: 60 * scale }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, textAlign: 'center' },
});
