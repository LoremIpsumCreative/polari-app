import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { Word } from '../types/database';
import { colors, radii, spacing } from '../lib/theme';
import { FavouriteButton } from './FavouriteButton';

type Props = {
  word: Word;
  style?: ViewStyle;
};

// The source sheet marks emphasis with *asterisks* (e.g. "From Italian *buono*");
// we don't render markdown, so strip them rather than show them raw.
function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

function Section({ label, children }: { label: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionBody}>{stripEmphasis(children)}</Text>
    </View>
  );
}

export function WordDetailCard({ word, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{word.entry_type === 'phrase' ? 'Phrase' : 'Word'}</Text>
        </View>
        {word.part_of_speech ? (
          <Text style={styles.partOfSpeech}>{word.part_of_speech}</Text>
        ) : null}
        <FavouriteButton wordId={word.id} />
      </View>

      <Text style={styles.term}>{word.term}</Text>
      {word.pronunciation ? (
        <Text style={styles.pronunciation}>/{word.pronunciation}/</Text>
      ) : null}

      <Text style={styles.definition}>{word.definition}</Text>

      {word.example ? <Section label="Example">{word.example}</Section> : null}
      {word.origin ? <Section label="Origin">{word.origin}</Section> : null}
      {word.notes_variants ? <Section label="Notes & variants">{word.notes_variants}</Section> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  partOfSpeech: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  term: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  pronunciation: {
    color: colors.textMuted,
    fontSize: 16,
  },
  definition: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
