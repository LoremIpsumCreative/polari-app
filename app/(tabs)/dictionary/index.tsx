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
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useWords } from '../../../src/lib/words';
import { useCollections } from '../../../src/lib/collections';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import type { Word } from '../../../src/types/database';

type Filter = 'all' | 'word' | 'phrase';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'word', label: 'Words' },
  { value: 'phrase', label: 'Phrases' },
];

function WordRow({ word, onPress }: { word: Word; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTerm}>{word.term}</Text>
        <Text style={styles.rowDefinition} numberOfLines={1}>
          {word.definition}
        </Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

function CollectionsRail() {
  const router = useRouter();
  const { collections } = useCollections();
  if (!collections.length) return null;
  return (
    <View style={styles.railWrap}>
      <Text style={styles.railLabel}>Collections</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
      >
        {collections.map((c) => {
          const accent = c.accent ? `#${c.accent}` : colors.primary;
          return (
            <Pressable
              key={c.slug}
              onPress={() => router.push(`/dictionary/collection/${c.slug}`)}
              style={({ pressed }) => [
                styles.collCard,
                { backgroundColor: `${accent}22` },
                pressed && styles.collPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${c.title} collection, ${c.wordIds.length} words`}
            >
              <Text style={[styles.collTitle, { color: accent }]} numberOfLines={2}>
                {c.title}
              </Text>
              <Text style={styles.collCount}>{c.wordIds.length} words</Text>
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
        <Text style={styles.errorText}>Couldn't load the dictionary.</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CollectionsRail />
      <TextInput
        style={styles.search}
        placeholder="Search Polari…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[styles.filterChipText, filter === f.value && styles.filterChipTextActive]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      <FlashList
        data={filtered}
        renderItem={({ item }) => (
          <WordRow word={item} onPress={() => router.push(`/dictionary/${item.slug}`)} />
        )}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No matches for “{query.trim()}”.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  railWrap: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  railLabel: {
    paddingHorizontal: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  railContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  collCard: {
    width: 150,
    height: 84,
    borderRadius: radii.md,
    padding: spacing.md - 2,
    justifyContent: 'space-between',
  },
  collPressed: {
    opacity: 0.7,
  },
  collTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 19,
  },
  collCount: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  search: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultCount: {
    marginLeft: 'auto',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTerm: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  rowDefinition: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  rowChevron: {
    fontFamily: fonts.regular,
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
});
