import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import IconRating18Plus from '@tabler/icons-react-native/IconRating18Plus';
import { colors } from '../lib/theme';

// The 18+ mark a flagged entry carries on its definition card (Figma
// Today/Definition - Flagged): a ~23px ring in the same grey as the full-screen
// control above it, sitting 41.5px lower on the same axis.
//
// The two screens that show a definition card anchor their own full-screen
// button differently — Today from the scroll content's padding, the dictionary
// detail from fixed coordinates — so the offset is applied at each call site.
// This component owns the mark and its box, not where the column begins.
export const FLAGGED_BADGE_OFFSET = 41.5;
// Matches the full-screen button's footprint (22px icon + 4px padding a side),
// so giving both the same `right` puts them on one axis without further sums.
const BOX = 30;

export function FlaggedBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[styles.box, style]}
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      // Read out rather than left as decoration: whether an entry is adult
      // content is exactly the sort of thing a screen-reader user is entitled
      // to know before reading the card.
      accessibilityLabel="Adult content"
    >
      <IconRating18Plus size={24} color={colors.metaText} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
