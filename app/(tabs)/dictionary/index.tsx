import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import {
  IconAdjustmentsHorizontal,
  IconChevronRight,
  IconMoodSad,
  IconSearch,
} from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useCollections } from '../../../src/lib/collections';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import type { Word } from '../../../src/types/database';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

// Geometry is read straight off the Figma frame (Dictionary/Dictionary Main,
// 1871:1178), whose 394-wide design space is close enough to a phone's width
// to use the coordinates directly: title y90, search y129, filter bar y158,
// "CURATED LISTS" y210, bundles y223, list panel y305 running off the bottom.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type Filter = 'all' | 'word' | 'phrase';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'word', label: 'Words' },
  { value: 'phrase', label: 'Phrases' },
];

// The bundle cards cycle blue → teal → green (Button/Bundles variants).
const BUNDLE_TINTS = [
  { fill: colors.primarySoft, edge: colors.primary },
  { fill: colors.relatedSoft, edge: colors.tealEdge },
  { fill: colors.greenSoft, edge: colors.green },
];

function DefinitionRow({ word, onPress }: { word: Word; onPress: () => void }) {
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
      <IconChevronRight size={12} color={colors.text} />
    </Pressable>
  );
}

// The horizontal rail of curated lists, each a tinted card showing its size.
function ColorBundles() {
  const router = useRouter();
  const { collections } = useCollections();
  if (!collections.length) return null;
  return (
    <View style={styles.bundlesWrap}>
      <Text style={styles.bundlesLabel}>CURATED LISTS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bundlesContent}
      >
        {collections.map((c, i) => {
          const tint = BUNDLE_TINTS[i % BUNDLE_TINTS.length];
          return (
            <Pressable
              key={c.slug}
              onPress={() => router.push(`/dictionary/collection/${c.slug}`)}
              style={({ pressed }) => [
                styles.bundle,
                { backgroundColor: tint.fill, borderColor: tint.edge },
                pressed && styles.pressedSoft,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${c.title} collection, ${c.wordIds.length} words`}
            >
              <Text style={styles.bundleTitle} numberOfLines={1}>
                {c.title}
              </Text>
              <Text style={styles.bundleCount}>
                {c.wordIds.length} {c.wordIds.length === 1 ? 'WORD' : 'WORDS'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function DictionaryScreen() {
  const router = useRouter();
  const { words, loading, error, refetch } = useWords();
  const listRef = useRef<FlashListRef<Word>>(null);
  // The bar floats over the screen, so the list and the A–Z rail have to keep
  // clear of it themselves — the frame bakes this in as the rail's 63px tail.
  const tabInset = useTabBarInset();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (filter !== 'all' && w.entry_type !== filter) return false;
      if (!q) return true;
      return (w.search_text ?? `${w.term} ${w.definition}`.toLowerCase()).includes(q);
    });
  }, [words, query, filter]);

  // First row index per initial letter, so the A–Z rail can jump the list.
  // Entries starting with punctuation ("-Ette") never claim a letter.
  const letterIndex = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((w, i) => {
      const letter = w.term.replace(/[^a-z]/gi, '').charAt(0).toUpperCase();
      if (letter && !map.has(letter)) map.set(letter, i);
    });
    return map;
  }, [filtered]);

  const jumpTo = (letter: string) => {
    const index = letterIndex.get(letter);
    if (index !== undefined) listRef.current?.scrollToIndex({ index, animated: true });
  };

  // The filter button's badge counts the narrowing filters actually applied.
  const activeFilters = (filter === 'all' ? 0 : 1) + (query.trim() ? 1 : 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nanti luck — the dictionary wouldn't load.</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <Text style={styles.title}>Polari Dictionary</Text>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search the dictionary"
        />
        {/* The frame parks the affordance on the right rather than using a
            leading placeholder, so the word is a sibling of the field. */}
        <View style={styles.searchHint} pointerEvents="none">
          {!query && <Text style={styles.searchHintText}>Search</Text>}
          <IconSearch size={12} color={colors.text} />
        </View>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterButtonWrap}>
          <Pressable
            style={({ pressed }) => [styles.filterButton, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel="Filters"
          >
            <IconAdjustmentsHorizontal size={12} color={colors.text} />
          </Pressable>
          {activeFilters > 0 && (
            <View style={styles.filterBadge} pointerEvents="none">
              <Text style={styles.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
        </View>
        <Text style={styles.filterDivider}>|</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ColorBundles />

      <View style={styles.panel}>
        <View style={styles.panelList}>
          <FlashList
            ref={listRef}
            data={filtered}
            renderItem={({ item }) => (
              <DefinitionRow
                word={item}
                onPress={() => router.push(`/dictionary/${item.slug}`)}
              />
            )}
            keyExtractor={(item) => item.slug}
            contentContainerStyle={{ paddingBottom: tabInset + spacing.md }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyTitleRow}>
                  <IconMoodSad size={26} color={colors.inactive} />
                  <Text style={styles.emptyTitle}>No results</Text>
                </View>
                <Text style={styles.emptyBody}>Try changing your filters{'\n'}and search again.</Text>
              </View>
            }
          />
        </View>
        <View style={[styles.pagination, { paddingBottom: tabInset + 50 }]}>
          {ALPHABET.map((letter) => {
            const enabled = letterIndex.has(letter);
            return (
              <Pressable
                key={letter}
                onPress={() => jumpTo(letter)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  title: {
    marginTop: 72,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
    color: colors.text,
    textAlign: 'center',
  },

  // Search field — Input/Search, x18 y129 w360.
  searchWrap: { marginHorizontal: 18, marginTop: 13, justifyContent: 'center' },
  search: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    paddingRight: 34,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  searchHint: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchHintText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
  },

  // Filter bar — Search bar, x17 y158 w377 h38.
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    paddingLeft: 17,
  },
  filterButtonWrap: { width: 38, paddingBottom: 6 },
  filterButton: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },
  filterDivider: { fontFamily: fonts.semibold, fontSize: 10, color: colors.inactive },
  filterOptions: { gap: 6, paddingRight: 17, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 9,
    letterSpacing: 0.3,
    color: colors.textMuted,
  },
  filterChipTextActive: { color: colors.onPrimary },

  // Curated lists — label y210, Color bundles y223 h65.
  bundlesWrap: { marginTop: 14, gap: 6 },
  bundlesLabel: {
    paddingHorizontal: 22,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  bundlesContent: { gap: 8, paddingHorizontal: 18 },
  bundle: {
    width: 130,
    height: 65,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  bundleTitle: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3, color: colors.text },
  bundleCount: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
  },

  // List panel — Horizontal container, x17 y305 w360, running off the bottom
  // with only its top corners rounded.
  panel: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.fieldBorder,
    height: 49.5,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
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

  // A–Z rail — Pagination, 19 wide, letters spread down the panel.
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

  // The frame outlines the empty area rather than leaving the panel bare.
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    paddingVertical: 140,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: 8,
  },
  emptyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.inactive },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inactive,
    textAlign: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.canvas,
  },
  errorText: { fontFamily: fonts.regular, fontSize: 16, color: colors.danger },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { color: colors.onPrimary, fontFamily: fonts.semibold },
  pressedSoft: { opacity: 0.7 },
});
