import Svg, { Path } from 'react-native-svg';
import type { IconProps } from '../../lib/icons';

// Tabler ships rating marks for 12+, 14+, 16+, 18+ and 21+ — but not 15+, which
// is the age this app actually states. Rather than round to 16+ (wrong number on
// an age gate) this redraws the mark from Tabler's own geometry so it sits
// beside the rest of the set without looking foreign.
//
// Everything here is lifted, not invented:
//   ring, "1" and "+"  — verbatim from IconRating18Plus / IconRating16Plus
//   "5"                — IconNumber5's single path, scaled into the digit box
//
// IconNumber5 draws `M8 20h4a4 4 0 1 0 0 -8h-4v-8h8` across x 8-16, y 4-20. The
// rating icons set their digits in x 10-13, y 9-15, so both axes scale by
// 3/8 = 6/16 = 0.375 and translate to (10, 9). Applying that to every command
// gives the path below, which is why its radii are 1.5 (4 x 0.375) and its runs
// are 1.5 and 3.
const RING = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0';
const ONE = 'M7 15v-6';
const FIVE = 'M10 15h1.5a1.5 1.5 0 1 0 0 -3h-1.5v-3h3';
const PLUS_H = 'M15.5 12h3';
const PLUS_V = 'M17 10.5v3';

/** The 15+ age mark, drawn to match Tabler's outline rating icons. */
export default function IconRating15Plus({
  size = 24,
  color = 'currentColor',
  ...rest
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {[RING, ONE, FIVE, PLUS_H, PLUS_V].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}
