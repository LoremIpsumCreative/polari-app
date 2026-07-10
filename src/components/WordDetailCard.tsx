import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import {
  IconBook2,
  IconInfoCircle,
  IconLink,
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
  // The dictionary detail additionally shows the notes/variants row; the Today
  // card matches the Figma frame exactly (definition, in use, origin, culture,
  // modern usage, related).
  compact?: boolean;
};

// Modern-usage segmented display, per Figma 1039:104: all three options shown,
// the word's status highlighted.
const USAGE_OPTIONS: { value: UsageStatus; label: string }[] = [
  { value: 'current', label: 'Common' },
  { value: 'rare', label: 'Rare' },
  { value: 'historical', label: 'Historical' },
];

// The source sheet marks emphasis with *asterisks* (e.g. "From Italian *buono*");
// we don't render markdown, so strip them rather than show them raw.
function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

// Labelled fieldset row per the Figma card: recessed grey row with a hairline
// border and a tiny uppercase label sitting on the border (white patch).
function FieldRow({
  label,
  Icon,
  children,
  italic = false,
}: {
  label: string;
  Icon: ComponentType<IconProps>;
  children: string;
  italic?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldRow}>
        <Icon size={14} color={colors.text} />
        <Text style={[styles.fieldText, italic && styles.fieldTextItalic]}>
          {stripEmphasis(children)}
        </Text>
      </View>
      <View style={styles.fieldLabelPatch}>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function WordDetailCard({ word, style, compact = false }: Props) {
  const [shareVisible, setShareVisible] = useState(false);
  const router = useRouter();
  const { bySlug } = useWords();
  const usage = (word.usage_status ?? null) as UsageStatus | null;
  const related = (word.related_slugs ?? [])
    .map((s) => bySlug.get(s))
    .filter((w): w is Word => !!w);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{word.entry_type === 'phrase' ? 'Phrase' : 'Word'}</Text>
        </View>
        {word.part_of_speech ? (
          <View style={styles.posChip}>
            <Text style={styles.posText}>{word.part_of_speech}</Text>
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
      {word.pronunciation ? <Text style={styles.pron}>/{word.pronunciation}/</Text> : null}

      <View style={styles.fields}>
        <FieldRow label="definition" Icon={IconBook2}>
          {word.definition}
        </FieldRow>
        {word.example ? (
          <FieldRow label="in use" Icon={IconQuote} italic>
            {word.example}
          </FieldRow>
        ) : null}
        {word.origin ? (
          <FieldRow label="origin" Icon={IconWorld}>
            {word.origin}
          </FieldRow>
        ) : null}
        {word.cultural_context ? (
          <FieldRow label="culture" Icon={IconWorld}>
            {word.cultural_context}
          </FieldRow>
        ) : null}
        {!compact && word.notes_variants ? (
          <FieldRow label="notes" Icon={IconNotes}>
            {word.notes_variants}
          </FieldRow>
        ) : null}
      </View>

      {word.sensitivity_note ? (
        <View style={styles.sensitiveRow}>
          <IconInfoCircle size={15} color={colors.textFaint} />
          <Text style={styles.sensitiveText}>{stripEmphasis(word.sensitivity_note)}</Text>
        </View>
      ) : null}

      {usage ? (
        <View style={styles.usageWrap}>
          <View style={styles.usagePill}>
            {USAGE_OPTIONS.map((opt) => (
              <View
                key={opt.value}
                style={[styles.usageOption, usage === opt.value && styles.usageOptionActive]}
              >
                <Text
                  style={[
                    styles.usageOptionText,
                    usage === opt.value && styles.usageOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.usageLabelPatch}>
            <Text style={styles.fieldLabel}>modern usage</Text>
          </View>
        </View>
      ) : null}

      {related.length ? (
        <View style={styles.relatedWrap}>
          <View style={styles.relatedRow}>
            <IconLink size={14} color={colors.text} />
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
          <View style={styles.relatedLabelPatch}>
            <Text style={styles.fieldLabel}>related</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    marginBottom: 34,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  posChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipGrey,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  posText: {
    color: colors.chipGrey,
    fontSize: 10,
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
    lineHeight: 34,
  },
  pron: {
    color: '#121212',
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    marginTop: 10,
    marginBottom: 6,
  },
  fields: {
    marginTop: spacing.md + 4,
    gap: 18,
  },
  fieldWrap: {
    position: 'relative',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.inset,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chipGrey,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 52,
  },
  fieldText: {
    flex: 1,
    color: '#121212',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  fieldTextItalic: {
    fontFamily: fonts.italic,
  },
  fieldLabelPatch: {
    position: 'absolute',
    top: -5,
    left: 7,
    backgroundColor: colors.surface,
    paddingHorizontal: 2,
  },
  fieldLabel: {
    color: colors.chipGrey,
    fontFamily: fonts.extrabold,
    fontSize: 7,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    lineHeight: 8,
  },
  sensitiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm + 4,
  },
  sensitiveText: {
    flex: 1,
    color: colors.textFaint,
    fontFamily: fonts.italic,
    fontSize: 12,
    lineHeight: 17,
  },
  usageWrap: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 20,
  },
  usagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.chipGrey,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  usageOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  usageOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  usageOptionText: {
    color: '#AAAAAA',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    lineHeight: 11,
  },
  usageOptionTextActive: {
    color: colors.primary,
  },
  usageLabelPatch: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 2,
  },
  relatedWrap: {
    position: 'relative',
    marginTop: 22,
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  relatedLabelPatch: {
    position: 'absolute',
    top: -5,
    left: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 2,
  },
  relatedChip: {
    backgroundColor: colors.relatedSoft,
    borderWidth: 1,
    borderColor: colors.related,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  relatedChipPressed: {
    opacity: 0.6,
  },
  relatedChipText: {
    color: colors.related,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
