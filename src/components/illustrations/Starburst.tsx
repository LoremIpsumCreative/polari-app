import { G, Path } from 'react-native-svg';

// Four-point atomic starburst, the classic 1950s "sparkle".
// Render inside an <Svg>; position/scale via x/y/size.
export function Starburst({
  x,
  y,
  size = 8,
  color,
}: {
  x: number;
  y: number;
  size?: number;
  color: string;
}) {
  const s = size / 8;
  return (
    <G transform={`translate(${x}, ${y}) scale(${s})`}>
      <Path
        d="M 0 -8 L 1.8 -1.8 L 8 0 L 1.8 1.8 L 0 8 L -1.8 1.8 L -8 0 L -1.8 -1.8 Z"
        fill={color}
      />
    </G>
  );
}
