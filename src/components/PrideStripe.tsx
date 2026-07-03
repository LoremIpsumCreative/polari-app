import { StyleSheet, View, type ViewStyle } from 'react-native';
import { prideStripes } from '../lib/theme';

// A quiet nod to Polari's queer roots: a hairline six-stripe flag,
// used as a horizontal rule/accent rather than a banner.
export function PrideStripe({ height = 3, style }: { height?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.row, { height, borderRadius: height / 2 }, style]}>
      {prideStripes.map((color) => (
        <View key={color} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
});
