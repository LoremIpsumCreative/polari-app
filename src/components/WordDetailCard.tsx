import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import IconBook2 from '@tabler/icons-react-native/IconBook2';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconLink from '@tabler/icons-react-native/IconLink';
import IconNotes from '@tabler/icons-react-native/IconNotes';
import IconQuote from '@tabler/icons-react-native/IconQuote';
import IconSend from '@tabler/icons-react-native/IconSend';
import IconStack2 from '@tabler/icons-react-native/IconStack2';
import IconWorldSearch from '@tabler/icons-react-native/IconWorldSearch';
import type { IconProps } from '../lib/icons';
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
        <Icon size={14} color={'#B3B9C4'} />
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
            <IconSend size={18} color={colors.textMuted} />
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
          <FieldRow label="origin" Icon={IconWorldSearch}>
            {word.origin}
          </FieldRow>
        ) : null}
        {word.cultural_context ? (
          <FieldRow label="culture" Icon={IconStack2}>
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
          <View style={styles.usageBox}>
            <IconChartBar size={14} color={'#B3B9C4'} />
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
          <View style={styles.fieldLabelPatch}>
            <Text style={styles.fieldLabel}>modern usage</Text>
          </View>
        </View>
      ) : null}

      {related.length ? (
        <View style={styles.relatedWrap}>
          <View style={styles.relatedRow}>
            <IconLink size={14} color={'#B3B9C4'} />
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
    backgroundColor: colors.inset,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    marginBottom: 19,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  posChip: {
    backgroundColor: colors.inset,
    borderWidth: 1,
    borderColor: colors.chipGrey,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    // No padding: the mock's row height comes from the 18px icon itself.
    padding: 0,
    borderRadius: radii.sm,
  },
  shareButtonPressed: {
    opacity: 0.6,
  },
  term: {
    color: colors.text,
    fontSize: 60,
    fontFamily: fonts.display,
    lineHeight: 42,
  },
  pron: {
    color: colors.metaText,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 12,
    marginTop: 12,
    marginBottom: 0,
  },
  fields: {
    marginTop: 20,
    gap: 12,
  },
  fieldWrap: {
    position: 'relative',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.fieldBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  fieldText: {
    flex: 1,
    color: colors.text,
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
    left: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  fieldLabel: {
    color: colors.label,
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
  // Boxed fieldset row per frame 1042-205: leading chart icon, options inside,
  // label patch sitting on the border like the other rows.
  usageWrap: {
    position: 'relative',
    marginTop: 16,
  },
  usageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.fieldBorder,
    borderRadius: 8,
    padding: 14,
  },
  usageOption: {
    paddingHorizontal: 20,
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
    color: colors.inactive,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    lineHeight: 11,
  },
  usageOptionTextActive: {
    color: colors.primary,
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.fieldBorder,
  },
  relatedLabelPatch: {
    position: 'absolute',
    top: -5,
    left: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 2,
  },
  relatedChip: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  relatedChipPressed: {
    opacity: 0.6,
  },
  relatedChipText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
