import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import IconAbc from '@tabler/icons-react-native/IconAbc';
import IconChartBar from '@tabler/icons-react-native/IconChartBar';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';
import IconChevronUp from '@tabler/icons-react-native/IconChevronUp';
import IconHeart from '@tabler/icons-react-native/IconHeart';
import IconHeartFilled from '@tabler/icons-react-native/IconHeartFilled';
import IconMessage from '@tabler/icons-react-native/IconMessage';
import IconMessages from '@tabler/icons-react-native/IconMessages';
import IconPhoto from '@tabler/icons-react-native/IconPhoto';
import IconTag from '@tabler/icons-react-native/IconTag';
import IconWorld from '@tabler/icons-react-native/IconWorld';
import type { Palette } from '../lib/palette';
import { useColors, useThemedStyles } from '../lib/appearance';
import { fonts } from '../lib/theme';
import { HEART_RED } from './CollectionChrome';
import {
  EMPTY_FILTERS,
  MODERN_USAGE_OPTIONS,
  ORIGIN_OPTIONS,
  THEME_OPTIONS,
  countActiveFilters,
  toggleValue,
  type DictionaryFilters,
} from '../lib/dictionaryFilters';

// The filter modal (Figma Dictionary/Filter Modal, 1889:1832). The card sits
// at x17 y130 over a dimmed backdrop; every option chip is the shared
// Button/FilterOption — 10px Bold, 6px radius, blue when selected.

export function FilterChip({
  label,
  selected,
  disabled,
  onPress,
  selectedColor,
  icon,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  selectedColor?: string;
  icon?: ReactNode;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  // Defaults to Brand/Primary, resolved per theme. A static default parameter
  // would pin every chip to the light brand blue — the same trap FieldsetInput's
  // notchColor had.
  const tint = selectedColor ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: tint, borderColor: tint },
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  label,
  Icon,
  options,
  selected,
  onToggle,
  disabled,
  note,
}: {
  label: string;
  Icon: typeof IconTag;
  options: string[];
  selected: string[];
  onToggle?: (value: string) => void;
  disabled?: boolean;
  note?: string;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(true);
  if (!options.length) return null;
  const Chevron = open ? IconChevronUp : IconChevronDown;
  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Icon size={10} color={colors.textFaint} />
        <Text style={styles.sectionLabel}>{label}</Text>
        <Chevron size={12} color={colors.text} />
      </Pressable>
      {open && (
        <>
          {note && <Text style={styles.sectionNote}>{note}</Text>}
          <View style={styles.sectionOptions}>
            {options.map((o) => (
              <FilterChip
                key={o}
                label={o}
                selected={selected.includes(o)}
                disabled={disabled}
                onPress={onToggle ? () => onToggle(o) : undefined}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export function DictionaryFilterModal({
  visible,
  onClose,
  filters,
  onChange,
  partOfSpeechOptions,
}: {
  visible: boolean;
  onClose: () => void;
  filters: DictionaryFilters;
  onChange: (next: DictionaryFilters) => void;
  partOfSpeechOptions: string[];
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const active = countActiveFilters(filters);
  const set = (patch: Partial<DictionaryFilters>) => onChange({ ...filters, ...patch });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters">
        {/* Taps inside the card must not close it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable
              onPress={() => onChange(EMPTY_FILTERS)}
              disabled={active === 0}
              accessibilityRole="button"
              style={({ pressed }) => [styles.clear, pressed && active > 0 && styles.pressed]}
            >
              <Text style={[styles.clearText, active === 0 && styles.clearTextDisabled]}>
                Clear
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <View style={styles.quickRow}>
              <FilterChip
                label="Words"
                selected={filters.words}
                onPress={() => set({ words: !filters.words })}
                icon={
                  <IconMessage size={11} color={filters.words ? colors.onPrimary : colors.text} />
                }
              />
              <FilterChip
                label="Phrases"
                selected={filters.phrases}
                onPress={() => set({ phrases: !filters.phrases })}
                icon={
                  <IconMessages
                    size={11}
                    color={filters.phrases ? colors.onPrimary : colors.text}
                  />
                }
              />
              <FilterChip
                label="Favourites"
                selected={filters.favourites}
                selectedColor={HEART_RED}
                onPress={() => set({ favourites: !filters.favourites })}
                icon={
                  filters.favourites ? (
                    <IconHeartFilled size={11} color={colors.onPrimary} />
                  ) : (
                    <IconHeart size={11} color={colors.text} />
                  )
                }
              />
            </View>

            <Section
              label="Part of Speech"
              Icon={IconAbc}
              options={partOfSpeechOptions}
              selected={filters.partOfSpeech}
              onToggle={(v) => set({ partOfSpeech: toggleValue(filters.partOfSpeech, v) })}
            />
            <Section
              label="Modern Usage"
              Icon={IconChartBar}
              options={MODERN_USAGE_OPTIONS}
              selected={filters.modernUsage}
              onToggle={(v) => set({ modernUsage: toggleValue(filters.modernUsage, v) })}
            />
            <Section
              label="Theme"
              Icon={IconTag}
              options={THEME_OPTIONS}
              selected={[]}
              disabled
              note="Coming soon"
            />
            <Section
              label="Origin"
              Icon={IconWorld}
              options={ORIGIN_OPTIONS}
              selected={[]}
              disabled
              note="Coming soon"
            />
            <Section
              label="Has Character Artwork"
              Icon={IconPhoto}
              options={['Yes']}
              selected={filters.hasArtwork ? ['Yes'] : []}
              onToggle={() => set({ hasArtwork: !filters.hasArtwork })}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(18, 18, 18, 0.5)' },
    card: {
      position: 'absolute',
      left: 17,
      right: 17,
      top: 130,
      maxHeight: '75%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 20,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: 0.3, color: colors.text },
    clear: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.fieldBorder,
    },
    clearText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.3, color: colors.text },
    clearTextDisabled: { color: colors.inactive },

    body: { paddingTop: 30, gap: 16 },
    quickRow: { flexDirection: 'row', gap: 12 },

    section: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.metaText,
      paddingHorizontal: 14,
      paddingVertical: 20,
      gap: 16,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    sectionLabel: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: colors.textFaint,
    },
    sectionNote: {
      marginTop: -8,
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: colors.inactive,
    },
    sectionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.metaText,
    },
    chipDisabled: { borderColor: colors.fieldBorder, backgroundColor: colors.inset },
    chipText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 9,
      letterSpacing: 0.3,
      color: colors.textMuted,
    },
    chipTextSelected: { color: colors.onPrimary },
    chipTextDisabled: { color: colors.inactive },
    pressed: { opacity: 0.7 },
  });
