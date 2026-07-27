import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useWords } from '../../../../src/lib/words';
import { useCollections } from '../../../../src/lib/collections';
import { colors, radii, spacing, fonts } from '../../../../src/lib/theme';
import type { Word } from '../../../../src/types/database';
import { ScreenBackground } from '../../../../src/components/ScreenBackground';

export default function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { bySlug: wordById } = useWords();
  const { bySlug: collectionBySlug, loading } = useCollections();

  const collection = slug ? collectionBySlug.get(slug) : undefined;
  const accent = collection?.accent ? `#${collection.accent}` : colors.primary;

  // Membership stores word ids; hydrate from the shared words cache in order.
  const wordsById = useMemo(() => {
    const map = new Map<string, Word>();
    for (const w of wordById.values()) map.set(w.id, w);
    return map;
  }, [wordById]);

  const words = useMemo(
    () => (collection?.wordIds ?? []).map((id) => wordsById.get(id)).filter((w): w is Word => !!w),
    [collection, wordsById]
  );

  return (
    <>
      <Stack.Screen options={{ title: collection?.title ?? 'Collection' }} />
      <View style={styles.screen}>
        <ScreenBackground />
        {collection ? (
          <FlashList
            data={words}
            keyExtractor={(item) => item.slug}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={[styles.pill, { backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.pillText, { color: accent }]}>
                    {words.length} {words.length === 1 ? 'word' : 'words'}
                  </Text>
                </View>
                <Text style={styles.title}>{collection.title}</Text>
                {collection.description ? (
                  <Text style={styles.description}>{collection.description}</Text>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/dictionary/${item.slug}`)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTerm}>{item.term}</Text>
                  <Text style={styles.rowDefinition} numberOfLines={1}>
                    {item.definition}
                  </Text>
                </View>
                <Text style={styles.rowChevron}>›</Text>
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.missingText}>{loading ? 'Loading…' : 'Collection not found.'}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl + 56 },
  header: { marginBottom: spacing.md, gap: spacing.xs },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.3 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
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
  rowPressed: { backgroundColor: colors.primarySoft },
  rowText: { flex: 1, gap: 2 },
  rowTerm: { fontSize: 16, fontFamily: fonts.semibold, color: colors.text },
  rowDefinition: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  rowChevron: { fontFamily: fonts.regular, fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missingText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
});
