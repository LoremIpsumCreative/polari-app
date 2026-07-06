import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import {
  IconBook2,
  IconHistory,
  IconInfoCircle,
  IconNotes,
  IconQuote,
  IconSend,
  IconWorld,
  type IconProps,
} from '@tabler/icons-react-native';
import type { Word, UsageStatus } from '../types/database';
import { colors, radii, spacing, fonts } from '../lib/theme';
import { useWords } from '../lib/words';
import { FavouriteButton } from './FavouriteButton';
import { ShareWordModal } from './ShareWordModal';

type Props = {
  word: Word;
  style?: ViewStyle;
  // Today shows the compact Figma card (definition + example only);
  // the dictionary detail keeps origin, notes and the cultural layer too.
  compact?: boolean;
};

// How alive a word is today — a small, honest signal that Polari is a living
// inheritance, not just an archive.
const USAGE: Record<UsageStatus, { label: string; fg: string; bg: string }> = {
  current: { label: 'Still heard', fg: colors.teal, bg: colors.tealSoft },
  rare: { label: 'Now rare', fg: colors.blush, bg: colors.blushSoft },
  historical: { label: 'Of its era', fg: colors.textMuted, bg: colors.inset },
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
  const router = useRouter();
  const { bySlug } = useWords();
  const usage = word.usage_status ? USAGE[word.usage_status as UsageStatus] : null;
  const related = (word.related_slugs ?? [])
    .map((s) => bySlug.get(s))
    .filter((w): w is Word => !!w);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{word.entry_type === 'phrase' ? 'Phrase' : 'Word'}</Text>
        </View>
        {usage ? (
          <View style={[styles.usageChip, { backgroundColor: usage.bg }]}>
            <Text style={[styles.usageText, { color: usage.fg }]}>{usage.label}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            onPress={() => setShareVisible(true)}
            style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Share this word"
            hitSlop={10}
          >
            <IconSend size={22} color={colors.textFaint} />
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

      {!compact && word.cultural_context ? (
        <View style={styles.contextBlock}>
          <View style={styles.contextHeader}>
            <IconHistory size={15} color={colors.primary} />
            <Text style={styles.contextTitle}>Where it lived</Text>
          </View>
          <Text style={styles.contextText}>{stripEmphasis(word.cultural_context)}</Text>
        </View>
      ) : null}

      {!compact && word.sensitivity_note ? (
        <View style={styles.sensitiveRow}>
          <IconInfoCircle size={15} color={colors.textFaint} />
          <Text style={styles.sensitiveText}>{stripEmphasis(word.sensitivity_note)}</Text>
        </View>
      ) : null}

      {!compact && related.length ? (
        <View style={styles.relatedWrap}>
          <Text style={styles.relatedLabel}>Related</Text>
          <View style={styles.relatedChips}>
            {related.map((r) => (
              <Pressable
                key={r.slug}
                onPress={() => router.push(`/dictionary/${r.slug}`)}
                style={({ pressed }) => [styles.relatedChip, pressed && styles.relatedChipPressed]}
                accessibilityRole="link"
                accessibilityLabel={`See ${r.term}`}
              >
                <Text style={styles.relatedChipText}>{r.term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
  usageChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  usageText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  contextBlock: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    padding: spacing.md - 4,
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  contextTitle: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  contextText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  sensitiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sensitiveText: {
    flex: 1,
    color: colors.textFaint,
    fontFamily: fonts.italic,
    fontSize: 12,
    lineHeight: 17,
  },
  relatedWrap: {
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  relatedLabel: {
    color: colors.textFaint,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  relatedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  relatedChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.xs + 1,
  },
  relatedChipPressed: {
    opacity: 0.6,
  },
  relatedChipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
