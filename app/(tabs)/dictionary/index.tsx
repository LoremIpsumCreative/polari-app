import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import IconAdjustmentsHorizontal from '@tabler/icons-react-native/IconAdjustmentsHorizontal';
import IconMoodSad from '@tabler/icons-react-native/IconMoodSad';
import IconSearch from '@tabler/icons-react-native/IconSearch';
import { useWords } from '../../../src/lib/words';
import { useFavourites } from '../../../src/lib/favourites';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { DictionaryFilterModal } from '../../../src/components/DictionaryFilterModal';
import {
  EMPTY_FILTERS,
  countActiveFilters,
  matchesFilters,
  partOfSpeechOptions,
  type DictionaryFilters,
} from '../../../src/lib/dictionaryFilters';
import { useCollections } from '../../../src/lib/collections';
import type { Palette } from '../../../src/lib/palette';
import { useColors, useThemedStyles } from '../../../src/lib/appearance';
import { radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { LoadFailedScreen, LoadingScreen } from '../../../src/components/LoadingScreen';
import { DictionaryListPanel } from '../../../src/components/DictionaryList';

// Geometry is read straight off the Figma frame (Dictionary/Dictionary Main,
// 1871:1178), whose 393-wide design space is close enough to a phone's width
// to use the coordinates directly: title y90, search y129, filter bar y158,
// "Curated Lists" y171, bundles y184, list panel y258 running off the bottom.
// The bundle cards cycle blue → teal → green (Button/Bundles variants).
// A function of the palette rather than a module constant: these are
// Button/List Fill+Stroke Variations 1-3, and all six values differ per scheme.
const bundleTints = (colors: Palette) => [
  { fill: colors.primarySoft, edge: colors.primary },
  { fill: colors.relatedSoft, edge: colors.tealEdge },
  { fill: colors.greenSoft, edge: colors.green },
];

// The horizontal rail of curated lists, each a tinted card showing its size.
function ColorBundles() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const BUNDLE_TINTS = bundleTints(colors);
  const router = useRouter();
  const { collections } = useCollections();
  if (!collections.length) return null;
  return (
    <View style={styles.bundlesWrap}>
      <Text style={styles.bundlesLabel}>Curated Lists</Text>
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
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { words, loading, error, refetch } = useWords();
  const { isFavourite } = useFavourites();
  const { castSlugs } = useCharacterArt();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DictionaryFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const artSlugs = useMemo(() => new Set(castSlugs), [castSlugs]);
  const posOptions = useMemo(() => partOfSpeechOptions(words), [words]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ctx = { isFavourite, hasArtwork: (slug: string) => artSlugs.has(slug) };
    return words.filter((w) => {
      if (!matchesFilters(w, filters, ctx)) return false;
      if (!q) return true;
      return (w.search_text ?? `${w.term} ${w.definition}`.toLowerCase()).includes(q);
    });
  }, [words, query, filters, isFavourite, artSlugs]);

  // The filter button's badge counts the narrowing filters actually applied.
  const activeFilters = countActiveFilters(filters);

  if (loading || error) {
    return (
      <View style={styles.container}>
        <ScreenBackground />
        {error ? <LoadFailedScreen onRetry={refetch} /> : <LoadingScreen />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <Text style={styles.title}>Polari Dictionary</Text>

      <View style={styles.searchRow}>
        <View style={styles.filterButtonWrap}>
          <Pressable
            onPress={() => setFiltersOpen(true)}
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
      </View>

      <ColorBundles />

      <DictionaryListPanel
        style={styles.panel}
        words={filtered}
        onSelect={(w) => router.push(`/dictionary/${w.slug}`)}
        empty={
          <View style={styles.empty}>
            <View style={styles.emptyTitleRow}>
              <IconMoodSad size={26} color={colors.inactive} />
              <Text style={styles.emptyTitle}>No results</Text>
            </View>
            <Text style={styles.emptyBody}>Try changing your filters{'\n'}and search again.</Text>
          </View>
        }
      />

      <DictionaryFilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        partOfSpeechOptions={posOptions}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
    // The 2028-08-19 frame puts the filter button and the search field on one
    // row. The Words / Phrases / Favourites chips that used to sit under them are
    // gone: the filter modal already offers all three, so the row was a duplicate
    // of a control the reader has one tap away.
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginHorizontal: 18,
      marginTop: 13,
    },
    searchWrap: { flex: 1, justifyContent: 'center' },
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
    filterButtonWrap: { width: 38 },
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

    // The panel's own geometry lives in DictionaryListPanel; the screen only
    // says where it starts.
    panel: { marginTop: 8 },
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

    pressedSoft: { opacity: 0.7 },
  });
