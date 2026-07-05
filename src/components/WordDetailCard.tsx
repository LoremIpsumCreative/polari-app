import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  IconBook2,
  IconNotes,
  IconQuote,
  IconSend,
  IconWorld,
  type IconProps,
} from '@tabler/icons-react-native';
import type { Word } from '../types/database';
import { colors, radii, spacing, fonts } from '../lib/theme';
import { FavouriteButton } from './FavouriteButton';
import { ShareWordModal } from './ShareWordModal';

type Props = {
  word: Word;
  style?: ViewStyle;
  // Today shows the compact Figma card (definition + example only);
  // the dictionary detail keeps origin and notes rows too.
  compact?: boolean;
};

// The source sheet marks emphasis with *asterisks* (e.g. "From Italian *buono*");
// we don't render markdown, so strip them rather than show them raw.
function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

// Recessed grey row with a small leading icon, per the Figma definition/example rows
function InsetRow({
  Icon,
  children,
  italic = false,
}: {
  Icon: ComponentType<IconProps>;
  children: string;
  italic?: boolean;
}) {
  return (
    <View style={styles.insetRow}>
      <Icon size={16} color={colors.textFaint} />
      <Text style={[styles.insetText, italic && styles.insetTextItalic]}>
        {stripEmphasis(children)}
      </Text>
    </View>
  );
}

export function WordDetailCard({ word, style, compact = false }: Props) {
  const [shareVisible, setShareVisible] = useState(false);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{word.entry_type === 'phrase' ? 'Phrase' : 'Word'}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={() => setShareVisible(true)}
            style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Share this word"
            hitSlop={10}
          >
            <IconSend size={22} color={colors.text} />
          </Pressable>
          <FavouriteButton wordId={word.id} />
        </View>
      </View>
      <ShareWordModal word={word} visible={shareVisible} onClose={() => setShareVisible(false)} />

      <Text style={styles.term}>{word.term}</Text>
      <View style={styles.metaBlock}>
        {word.pronunciation ? <Text style={styles.meta}>/{word.pronunciation}/</Text> : null}
        {word.part_of_speech ? <Text style={styles.meta}>{word.part_of_speech}</Text> : null}
      </View>

      <InsetRow Icon={IconBook2}>{word.definition}</InsetRow>
      {word.example ? (
        <InsetRow Icon={IconQuote} italic>
          {word.example}
        </InsetRow>
      ) : null}
      {!compact && word.origin ? <InsetRow Icon={IconWorld}>{word.origin}</InsetRow> : null}
      {!compact && word.notes_variants ? (
        <InsetRow Icon={IconNotes}>{word.notes_variants}</InsetRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  actions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareButton: {
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  shareButtonPressed: {
    opacity: 0.6,
  },
  term: {
    color: colors.text,
    fontSize: 34,
    fontFamily: fonts.semibold,
  },
  metaBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  meta: {
    color: colors.textFaint,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  insetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    backgroundColor: colors.inset,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md - 6,
    paddingVertical: spacing.md - 4,
  },
  insetText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  insetTextItalic: {
    fontFamily: fonts.italic,
  },
});
