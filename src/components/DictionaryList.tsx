import { useMemo, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconFlagFilled from '@tabler/icons-react-native/IconFlagFilled';
import type { Palette } from '../lib/palette';
import { useColors, useThemedStyles } from '../lib/appearance';
import { fonts } from '../lib/theme';
import type { Word } from '../types/database';
import { useTabBarInset } from './AnimatedTabBar';

// The list panel shared by Dictionary Main (1871:1178) and Curated List
// (1885:1496): a #F8F9FA container that runs off the bottom of the screen with
// only its top corners rounded, holding 49.5px rows, with the A–Z pagination
// rail down its right edge.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function DefinitionRow({ word, onPress }: { word: Word; onPress: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTerm} numberOfLines={1}>
          {word.term}
        </Text>
        <Text style={styles.rowDefinition} numberOfLines={1}>
          {word.definition}
        </Text>
      </View>
      {/* Flagged entries carry a red flag just inside the chevron (Dictionary
          Main 1871:1178 and Curated List 1885:1496 both place it there). Same
          red as the quiz's incorrect marker — it is the one "careful" ink the
          palette has. */}
      {word.flagged ? (
        <IconFlagFilled
          size={12}
          color={colors.incorrect}
          accessibilityLabel="Flagged entry"
          // The row's uniform 12px gap leaves the glyph 2px right of the frame;
          // the icon's own box is wider than its ink, which the gap can't know.
          style={styles.rowFlag}
        />
      ) : null}
      <IconChevronRight size={12} color={colors.text} />
    </Pressable>
  );
}

export function DictionaryListPanel({
  words,
  onSelect,
  empty,
  style,
}: {
  words: Word[];
  onSelect: (word: Word) => void;
  empty?: ReactNode;
  style?: object;
}) {
  const styles = useThemedStyles(makeStyles);
  const listRef = useRef<FlashListRef<Word>>(null);
  // The tab bar floats over the screen, so the list and the rail keep clear of
  // it themselves — the frame bakes this in as the rail's fixed tail.
  const tabInset = useTabBarInset();

  // First row index per initial letter, so the rail can jump the list. Entries
  // starting with punctuation ("-Ette") never claim a letter.
  const letterIndex = useMemo(() => {
    const map = new Map<string, number>();
    words.forEach((w, i) => {
      const letter = w.term
        .replace(/[^a-z]/gi, '')
        .charAt(0)
        .toUpperCase();
      if (letter && !map.has(letter)) map.set(letter, i);
    });
    return map;
  }, [words]);

  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelList}>
        <FlashList
          ref={listRef}
          data={words}
          renderItem={({ item }) => <DefinitionRow word={item} onPress={() => onSelect(item)} />}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={{ paddingBottom: tabInset + 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={empty ? <>{empty}</> : null}
        />
      </View>
      <View style={[styles.pagination, { paddingBottom: tabInset + 50 }]}>
        {ALPHABET.map((letter) => {
          const index = letterIndex.get(letter);
          const enabled = index !== undefined;
          return (
            <Pressable
              key={letter}
              onPress={() => {
                if (index !== undefined) listRef.current?.scrollToIndex({ index, animated: true });
              }}
              disabled={!enabled}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Jump to ${letter}`}
            >
              <Text style={[styles.paginationLetter, !enabled && styles.paginationLetterOff]}>
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    panel: {
      flex: 1,
      flexDirection: 'row',
      marginHorizontal: 17,
      paddingLeft: 20,
      paddingRight: 12,
      paddingTop: 20,
      gap: 9,
      backgroundColor: colors.inset,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.fieldBorder,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    panelList: { flex: 1 },

    // Height is pinned rather than intrinsic: Figma trims text boxes to cap
    // height, which RN cannot do, so the leading would push rows past 49.5.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 49.5,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.fieldBorder,
      paddingHorizontal: 12,
      marginBottom: 6,
    },
    rowPressed: { backgroundColor: colors.primarySoft },
    rowFlag: { marginRight: 2 },
    rowText: { flex: 1, gap: 3 },
    rowTerm: {
      fontFamily: fonts.bold,
      fontSize: 14,
      lineHeight: 15,
      letterSpacing: 0.3,
      color: colors.text,
    },
    rowDefinition: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      lineHeight: 11,
      letterSpacing: 0.3,
      color: colors.text,
    },

    pagination: {
      width: 19,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
    },
    paginationLetter: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 11,
      letterSpacing: 0.3,
      textAlign: 'center',
      color: colors.text,
    },
    paginationLetterOff: { color: colors.inactive },
  });
