import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Word } from '../types/database';

// The visual card that gets snapshotted and shared as an image.
// Fixed 4:5 portrait ratio (1080x1350 at capture scale) — the format
// Instagram/social feeds crop least.
export const CARD_WIDTH = 340;
export const CARD_HEIGHT = 425;

// Deliberately its own palette (not theme.ts): the card is a branded artefact
// that should look identical regardless of any future in-app dark mode.
const card = {
  background: '#3B0764',
  surface: '#4C1D95',
  cream: '#FAF7F2',
  gold: '#F59E0B',
  lilac: '#C4B5FD',
};

export const ShareWordCard = forwardRef<View, { word: Word }>(function ShareWordCard(
  { word },
  ref
) {
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <Text style={styles.kicker}>Polari · word of the day</Text>

      <View style={styles.middle}>
        <Text style={styles.term} numberOfLines={2} adjustsFontSizeToFit>
          {word.term}
        </Text>
        {word.pronunciation ? (
          <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>
        ) : null}
        <View style={styles.rule} />
        <Text style={styles.definition} numberOfLines={4}>
          {word.definition}
        </Text>
        {word.example ? (
          <Text style={styles.example} numberOfLines={3}>
            {word.example}
          </Text>
        ) : null}
      </View>

      <Text style={styles.footer}>Learn the lingo ✨ Polari</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: card.background,
    borderRadius: 24,
    padding: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  kicker: {
    color: card.gold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  middle: {
    gap: 10,
  },
  term: {
    color: card.cream,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 50,
  },
  pronunciation: {
    color: card.lilac,
    fontSize: 18,
  },
  rule: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: card.gold,
    marginVertical: 6,
  },
  definition: {
    color: card.cream,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
  example: {
    color: card.lilac,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    color: card.lilac,
    fontSize: 13,
    fontWeight: '600',
  },
});
