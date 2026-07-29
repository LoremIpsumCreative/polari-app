import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconAdjustmentsHorizontal, IconMoodSad, IconSearch } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useFavourites } from '../../../src/lib/favourites';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import {
  DictionaryFilterModal,
  FilterChip,
} from '../../../src/components/DictionaryFilterModal';
import { HEART_RED } from '../../../src/components/CollectionChrome';
import {
  EMPTY_FILTERS,
  countActiveFilters,
  matchesFilters,
  partOfSpeechOptions,
  type DictionaryFilters,
} from '../../../src/lib/dictionaryFilters';
import { useCollections } from '../../../src/lib/collections';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { DictionaryListPanel } from '../../../src/components/DictionaryList';

// Geometry is read straight off the Figma frame (Dictionary/Dictionary Main,
// 1871:1178), whose 393-wide design space is close enough to a phone's width
// to use the coordinates directly: title y90, search y129, filter bar y158,
// "CURATED LISTS" y210, bundles y223, list panel y305 running off the bottom.
// The bundle cards cycle blue → teal → green (Button/Bundles variants).
const BUNDLE_TINTS = [
  { fill: colors.primarySoft, edge: colors.primary },
  { fill: colors.relatedSoft, edge: colors.tealEdge },
  { fill: colors.greenSoft, edge: colors.green },
];

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
        <Text style={styles.filterDivider}>|</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterOptions}
        >
          <FilterChip
            label="Words"
            selected={filters.words}
            onPress={() => setFilters((f) => ({ ...f, words: !f.words }))}
          />
          <FilterChip
            label="Phrases"
            selected={filters.phrases}
            onPress={() => setFilters((f) => ({ ...f, phrases: !f.phrases }))}
          />
          <FilterChip
            label="Favourites"
            selected={filters.favourites}
            selectedColor={HEART_RED}
            onPress={() => setFilters((f) => ({ ...f, favourites: !f.favourites }))}
          />
        </ScrollView>
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
