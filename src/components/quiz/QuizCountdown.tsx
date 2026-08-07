import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import { colors, fonts } from '../../lib/theme';
import { ScreenBackground } from '../ScreenBackground';
import { QuizStatHeader } from './QuizStatHeader';

// The 3 · 2 · 1 screen, rebuilt to the current frames (Quiz/*_Countdown panes in
// section 1353:769). It is a LIGHT screen now — the dark stage, spotlight wash
// and blurb panel are gone. What remains: the mode title, a hand-drawn grey
// card, and the count inside it under a navy "Quiz starts in:" pill.
//
// Tops are cap lines solved back through the fonts' metrics (Digitale: asc
// 0.97em, desc 0.27em, cap 0.71em; Mouse Memoirs: 0.9375 / 0.2125 / 0.71925).
const CD = {
  backChip: { x: 17, y: 51.5, w: 80, h: 31 },
  titleTop: 107, // matches the question screen's Mode Text
  titleSize: 60,
  titleLine: 52.8,
  card: {
    x: 80,
    y: 312,
    w: 235,
    h: 200.5,
    fill: colors.background,
    // "Vector 9" — a tapered, hand-drawn card, not a plain rounded rect.
    d: 'M210.228 0.896026 L23.3402 7.65578 C10.8703 8.10682 1.54222 19.2675 3.31138 31.6195 L24.9186 182.477 C26.3999 192.82 35.2587 200.5 45.7065 200.5 L190.547 200.5 C201.101 200.5 210.016 192.667 211.373 182.201 L231.812 24.5829 C233.481 11.7142 223.195 0.426974 210.228 0.896026 Z',
  },
  pill: { x: 138.5, y: 357.5, w: 118, h: 30, fill: colors.chipGrey },
  numberTop: 397.5, // cap line 405.5
  numberSize: 100,
  numberLine: 88,
};

type Props = {
  /** Design-frame scale from useDesignScale. */
  scale: number;
  /** Title under the back chip — the mode's label, or "Review". */
  title: string;
  /** Seconds remaining; floors at 1 so the card never shows a bare 0. */
  count: number;
  streak: number;
  highScore: number | null;
  onBack: () => void;
};

export function QuizCountdown({ scale: s, title, count, streak, highScore, onBack }: Props) {
  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <Pressable
        style={[
          styles.cdBackChip,
          {
            left: CD.backChip.x * s,
            top: CD.backChip.y * s,
            width: CD.backChip.w * s,
            height: CD.backChip.h * s,
          },
        ]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to quizzes"
      >
        <IconChevronLeft size={10 * s} color={colors.text} />
        <Text style={[styles.cdBackText, { fontSize: 10 * s }]}>Quizzes</Text>
      </Pressable>

      <Text
        style={[
          styles.cdTitle,
          { top: CD.titleTop * s, fontSize: CD.titleSize * s, lineHeight: CD.titleLine * s },
        ]}
      >
        {title}
      </Text>

      <QuizStatHeader scale={s} streak={streak} highScore={highScore} />

      {/* The count sits in a hand-drawn card, under its label pill */}
      <Svg
        style={{ position: 'absolute', left: CD.card.x * s, top: CD.card.y * s }}
        width={CD.card.w * s}
        height={CD.card.h * s}
        viewBox={`0 0 ${CD.card.w} ${CD.card.h}`}
        pointerEvents="none"
      >
        <Path d={CD.card.d} fill={CD.card.fill} />
      </Svg>

      <View
        style={[
          styles.cdPill,
          {
            left: CD.pill.x * s,
            top: CD.pill.y * s,
            width: CD.pill.w * s,
            height: CD.pill.h * s,
            borderRadius: (CD.pill.h * s) / 2,
          },
        ]}
      >
        <Text style={[styles.cdPillText, { fontSize: 14 * s }]}>Quiz starts in:</Text>
      </View>

      <Text
        style={[
          styles.cdNumber,
          {
            top: CD.numberTop * s,
            left: CD.pill.x * s,
            width: CD.pill.w * s,
            fontSize: CD.numberSize * s,
            lineHeight: CD.numberLine * s,
          },
        ]}
      >
        {Math.max(count, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  cdBackChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.inset,
    borderRadius: 999,
  },
  cdBackText: { fontFamily: fonts.bold, color: colors.text },
  cdTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.text,
  },
  cdPill: {
    position: 'absolute',
    backgroundColor: colors.chipGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdPillText: { fontFamily: fonts.bold, color: colors.onPrimary },
  cdNumber: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    color: colors.chipGrey,
  },
});
