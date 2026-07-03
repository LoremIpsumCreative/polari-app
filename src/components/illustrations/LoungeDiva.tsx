import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { Starburst } from './Starburst';

// Retro-modern lounge diva: teal skin, antennae, opera gloves, O-ring choker.
// Flat 1950s illustration style — big bouffant, closed happy eyes, tiny waist.
const ink = '#2B211E';
const skin = '#4FB3A5'; // teal — deliberately not a human tone
const gown = '#C7402D';
const hair = '#EFB63C';
const blob = '#F5C2B5'; // dusty lounge pink
const cheek = '#E98F7F';

export function LoungeDiva({ width = 220 }: { width?: number }) {
  return (
    <Svg width={width} height={width} viewBox="0 0 200 200">
      {/* backdrop blob + sparkles */}
      <Path
        d="M 30 110 C 20 60, 60 20, 110 22 C 165 24, 185 70, 178 115 C 172 160, 130 185, 85 180 C 45 176, 38 150, 30 110 Z"
        fill={blob}
      />
      <Starburst x={40} y={42} size={9} color={ink} />
      <Starburst x={162} y={38} size={7} color={ink} />
      <Starburst x={170} y={142} size={8} color={ink} />

      {/* floor shadow */}
      <Ellipse cx={100} cy={172} rx={44} ry={5} fill={ink} opacity={0.12} />

      {/* mic stand */}
      <Line x1={57} y1={168} x2={57} y2={98} stroke={ink} strokeWidth={2.5} />
      <Ellipse cx={57} cy={170} rx={11} ry={3} fill={ink} />
      <Circle cx={57} cy={93} r={5.5} fill={ink} />

      {/* gown */}
      <Path
        d="M 88 88 C 86 100, 93 110, 95 118 C 89 132, 77 150, 70 168 L 96 168 C 98 171, 102 171, 104 168 L 130 168 C 123 150, 111 132, 105 118 C 107 110, 114 100, 112 88 Z"
        fill={gown}
      />

      {/* chest + neck */}
      <Path d="M 89 89 L 111 89 L 108 80 L 92 80 Z" fill={skin} />

      {/* opera-gloved arms, raised showgirl-style */}
      <Path d="M 91 90 Q 76 72 67 49" stroke={ink} strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M 109 90 Q 124 72 133 49" stroke={ink} strokeWidth={7} strokeLinecap="round" fill="none" />

      {/* head */}
      <Ellipse cx={100} cy={62} rx={14} ry={16} fill={skin} />

      {/* choker collar with O-ring */}
      <Path d="M 93 78 L 107 78 L 106.5 81.5 L 93.5 81.5 Z" fill={ink} />
      <Circle cx={100} cy={84} r={2.4} stroke={ink} strokeWidth={1.6} fill="none" />

      {/* bouffant + side curls */}
      <Ellipse cx={100} cy={44} rx={20} ry={15} fill={hair} />
      <Circle cx={82} cy={54} r={6} fill={hair} />
      <Circle cx={118} cy={54} r={6} fill={hair} />

      {/* antennae */}
      <Line x1={92} y1={33} x2={87} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <Line x1={108} y1={33} x2={113} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={87} cy={18} r={3} fill={cheek} />
      <Circle cx={113} cy={18} r={3} fill={cheek} />

      {/* face: closed happy eyes, cheeks, red lips */}
      <Path d="M 91 61 Q 94 64 97 61" stroke={ink} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path d="M 103 61 Q 106 64 109 61" stroke={ink} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Circle cx={89} cy={67} r={2.2} fill={cheek} opacity={0.7} />
      <Circle cx={111} cy={67} r={2.2} fill={cheek} opacity={0.7} />
      <Ellipse cx={100} cy={70} rx={3.4} ry={2} fill={gown} />
    </Svg>
  );
}
