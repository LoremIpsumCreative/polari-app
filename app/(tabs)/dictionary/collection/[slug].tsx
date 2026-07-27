import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useWords } from '../../../../src/lib/words';
import { useCollections } from '../../../../src/lib/collections';
import { colors, radii, fonts } from '../../../../src/lib/theme';
import type { Word } from '../../../../src/types/database';
import { ScreenBackground } from '../../../../src/components/ScreenBackground';
import { DictionaryListPanel } from '../../../../src/components/DictionaryList';

// Curated List (Figma 1885:1496): back chip y52, "{#} Words" badge y123,
// list name y161, description y189, then the shared list panel from y222.

// The chip's 5px caret, drawn rather than taken from the icon set so it keeps
// the frame's solid triangle.
function BackCaret() {
  return (
    <Svg width={5} height={5} viewBox="0 0 5 5">
      <Path d="M4.5 0 L4.5 5 L0 2.5 Z" fill={colors.text} />
    </Svg>
  );
}

export default function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { bySlug: wordById } = useWords();
  const { bySlug: collectionBySlug, loading } = useCollections();

  const collection = slug ? collectionBySlug.get(slug) : undefined;

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
    <View style={styles.screen}>
      <ScreenBackground />

      <Pressable
        onPress={() => router.push('/dictionary')}
        style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Back to Dictionary"
      >
        <BackCaret />
        <Text style={styles.backChipText}>Dictionary</Text>
      </Pressable>

      {collection ? (
        <>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {words.length} {words.length === 1 ? 'Word' : 'Words'}
            </Text>
          </View>
          <Text style={styles.title}>{collection.title}</Text>
          {collection.description ? (
            <Text style={styles.description}>{collection.description}</Text>
          ) : null}
          <DictionaryListPanel
            style={styles.panel}
            words={words}
            onSelect={(w) => router.push(`/dictionary/${w.slug}`)}
          />
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.missingText}>{loading ? 'Loading…' : 'Collection not found.'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },

  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 52,
    marginLeft: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.inset,
  },
  backChipText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
  },
  pressed: { opacity: 0.7 },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 33,
    marginLeft: 17,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 9,
    letterSpacing: 0.3,
    color: colors.primary,
  },

  title: {
    marginTop: 12,
    marginHorizontal: 17,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.3,
    color: colors.text,
  },
  description: {
    marginTop: 8,
    marginHorizontal: 17,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  panel: { marginTop: 8 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  missingText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
});
