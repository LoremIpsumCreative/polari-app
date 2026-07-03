import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { Starburst } from './Starburst';

// Retro-modern space host: lavender skin, Saturn-ring halo, crop top with a
// cream chest harness, wrist cuff, hanky-code pocket square, martini aloft.
const ink = '#2B211E';
const skin = '#B89BD9'; // lavender — deliberately not a human tone
const blob = '#4FAE9F'; // atomic teal
const cream = '#FAF3E7';
const gold = '#DE9A26';
const hanky = '#E98F7F';

export function SpaceHost({ width = 220 }: { width?: number }) {
  return (
    <Svg width={width} height={width} viewBox="0 0 200 200">
      {/* backdrop blob + sparkles */}
      <Path
        d="M 26 100 C 24 55, 62 24, 108 26 C 158 28, 180 66, 176 110 C 172 155, 136 182, 90 178 C 48 174, 28 142, 26 100 Z"
        fill={blob}
      />
      <Starburst x={38} y={44} size={8} color={cream} />
      <Starburst x={164} y={50} size={9} color={cream} />
      <Starburst x={156} y={148} size={7} color={cream} />

      {/* floor shadow */}
      <Ellipse cx={100} cy={170} rx={38} ry={5} fill={ink} opacity={0.16} />

      {/* trousers (high-waist mustard) + shoes */}
      <Path
        d="M 88 112 C 88 130, 90 150, 92 164 L 99 164 L 100 136 L 101 164 L 108 164 C 110 150, 112 130, 112 112 Z"
        fill={gold}
      />
      <Ellipse cx={95} cy={166} rx={7} ry={3} fill={ink} />
      <Ellipse cx={106} cy={166} rx={7} ry={3} fill={ink} />

      {/* hanky-code pocket square */}
      <Path d="M 110 113 L 117 113 L 113.5 123 Z" fill={hanky} />

      {/* midriff (crop top gap) */}
      <Path d="M 89 104 L 111 104 L 112 112 L 88 112 Z" fill={skin} />

      {/* crop top with cream harness straps + centre ring */}
      <Path d="M 88 84 L 112 84 L 112 104 L 88 104 Z" fill={ink} />
      <Line x1={90} y1={86} x2={110} y2={102} stroke={cream} strokeWidth={2} />
      <Line x1={110} y1={86} x2={90} y2={102} stroke={cream} strokeWidth={2} />
      <Circle cx={100} cy={94} r={2.6} stroke={cream} strokeWidth={1.6} fill={ink} />

      {/* left arm on hip */}
      <Path d="M 89 88 Q 76 96 82 107 Q 86 111 90 107" stroke={skin} strokeWidth={6} strokeLinecap="round" fill="none" />

      {/* right arm raised with martini */}
      <Path d="M 111 88 Q 125 78 129 63" stroke={skin} strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* wrist cuff */}
      <Line x1={126} y1={65} x2={133} y2={62} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={131} cy={58} r={3.5} fill={skin} />
      {/* martini glass */}
      <Path d="M 123 40 L 131 51 L 139 40 Z" fill={cream} stroke={ink} strokeWidth={1.5} />
      <Line x1={131} y1={51} x2={131} y2={58} stroke={ink} strokeWidth={1.5} />
      <Circle cx={131} cy={44} r={1.8} fill={blob} />

      {/* neck + collar */}
      <Path d="M 96 76 L 104 76 L 104 84 L 96 84 Z" fill={skin} />
      <Line x1={95.5} y1={79} x2={104.5} y2={79} stroke={ink} strokeWidth={2.5} />

      {/* head */}
      <Circle cx={100} cy={66} r={13} fill={skin} />

      {/* pompadour */}
      <Path
        d="M 86 62 C 82 46, 100 36, 112 44 C 119 49, 117 57, 114 60 C 109 51, 94 51, 86 62 Z"
        fill={ink}
      />

      {/* Saturn-ring halo through the pompadour */}
      <Ellipse
        cx={100}
        cy={48}
        rx={27}
        ry={8}
        stroke={gold}
        strokeWidth={2.5}
        fill="none"
        transform="rotate(-12 100 48)"
      />

      {/* face: closed eyes, handlebar moustache, cheeks */}
      <Path d="M 91 64 Q 94 67 97 64" stroke={ink} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M 103 64 Q 106 67 109 64" stroke={ink} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path
        d="M 94 73 Q 97 70.5 100 73 Q 103 70.5 106 73"
        stroke={ink}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={92.5} cy={72} r={1.4} fill={ink} />
      <Circle cx={107.5} cy={72} r={1.4} fill={ink} />
      <Circle cx={89} cy={69} r={2} fill={hanky} opacity={0.7} />
      <Circle cx={111} cy={69} r={2} fill={hanky} opacity={0.7} />
    </Svg>
  );
}
