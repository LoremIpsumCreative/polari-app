import { StyleSheet, Text, View } from 'react-native';
import IconFlame from '@tabler/icons-react-native/IconFlame';
import IconTrophy from '@tabler/icons-react-native/IconTrophy';
import type { Palette } from '../../lib/palette';
import { useColors, useThemedStyles } from '../../lib/appearance';
import { fonts } from '../../lib/theme';

// The STREAK / HIGH SCORE pair that sits under the mode title at y210.5, on both
// the countdown and the question screen. The two screens had identical markup
// for it, down to the gap and the zero-padding, so a change to one silently
// stopped matching the other.
//
// High score is hidden entirely in review mode — there is no score to beat when
// the run is a due-word review rather than a game.

type Props = {
  /** Design-frame scale from useDesignScale. */
  scale: number;
  streak: number;
  /** null hides the pill — review mode has no high score. */
  highScore: number | null;
};

/** Two digits minimum, matching the frames: `07`, not `7`. */
const pad = (n: number) => String(n).padStart(2, '0');

export function QuizStatHeader({ scale: s, streak, highScore }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.headerStats, { top: 210.5 * s, gap: 57 * s }]}>
      <View style={styles.statGroup}>
        <IconFlame size={10 * s} color={colors.textFaint} />
        <Text style={[styles.statLabel, { fontSize: 10 * s }]}>STREAK:</Text>
        <Text style={[styles.statValue, { fontSize: 14 * s }]}>{pad(streak)}</Text>
      </View>
      {highScore !== null ? (
        <View style={styles.statGroup}>
          <IconTrophy size={10 * s} color={colors.textFaint} />
          <Text style={[styles.statLabel, { fontSize: 10 * s }]}>HIGH SCORE:</Text>
          <Text style={[styles.statValue, { fontSize: 14 * s }]}>{pad(highScore)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    headerStats: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statLabel: { fontFamily: fonts.semibold, color: colors.textFaint, letterSpacing: 0.3 },
    statValue: { fontFamily: fonts.bold, color: colors.textFaint, letterSpacing: 0.3 },
  });
