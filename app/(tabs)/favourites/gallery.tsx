import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  CHARACTER_SLUGS,
  COMING_SOON_ART,
  characterArtFor,
} from '../../../src/lib/characterArt';
import { CharacterFullScreen } from '../../../src/components/CharacterFullScreen';
import { useWords } from '../../../src/lib/words';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import type { ImageSourcePropType } from 'react-native';

// The cast gallery: every finished character illustration, linked back to its
// word. Tap the art for full screen, tap the term to read the entry.
export default function GalleryScreen() {
  const router = useRouter();
  const { bySlug, words } = useWords();
  const [fullScreen, setFullScreen] = useState<{
    source: ImageSourcePropType;
    label: string;
  } | null>(null);

  const cast = useMemo(
    () =>
      CHARACTER_SLUGS.map((slug) => ({
        slug,
        term: bySlug.get(slug)?.term ?? slug,
        art: characterArtFor(slug),
      })).sort((a, b) => a.term.localeCompare(b.term)),
    [bySlug]
  );
  const comingSoon = Math.max(0, words.length - cast.length);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lede}>
        The cast so far — every word earns a face, {cast.length} drawn, the rest in the
        dressing room.
      </Text>
      <View style={styles.grid}>
        {cast.map((c) => (
          <View key={c.slug} style={styles.card}>
            <Pressable
              onPress={() => setFullScreen({ source: c.art, label: `Illustration for ${c.term}` })}
              accessibilityRole="imagebutton"
              accessibilityLabel={`View ${c.term} full screen`}
              // Pressable shrink-wraps its content; the Image's width:'100%' needs
              // the wrapper to span the card or it collapses to 0 on web.
              style={styles.artPress}
            >
              <Image source={c.art} style={styles.art} resizeMode="contain" />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/dictionary/${c.slug}`)}
              accessibilityRole="link"
              accessibilityLabel={`Read the entry for ${c.term}`}
              style={({ pressed }) => [styles.termWrap, pressed && styles.termPressed]}
            >
              <Text style={styles.term} numberOfLines={1}>
                {c.term}
              </Text>
            </Pressable>
          </View>
        ))}
        <View style={[styles.card, styles.cardSoon]}>
          <Image source={COMING_SOON_ART} style={styles.art} resizeMode="contain" />
          <Text style={styles.soonText}>+{comingSoon} coming soon</Text>
        </View>
      </View>

      <CharacterFullScreen
        source={fullScreen?.source ?? COMING_SOON_ART}
        visible={!!fullScreen}
        onClose={() => setFullScreen(null)}
        label={fullScreen?.label ?? ''}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl + 96 },
  lede: {
    fontFamily: fonts.italic,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexBasis: '48.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardSoon: {
    backgroundColor: colors.inset,
  },
  artPress: {
    width: '100%',
  },
  art: {
    width: '100%',
    height: 150,
  },
  termWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  termPressed: { opacity: 0.6 },
  term: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  soonText: {
    fontFamily: fonts.italic,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
});
