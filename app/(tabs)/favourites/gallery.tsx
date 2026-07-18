import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COMING_SOON_ART } from '../../../src/lib/characterArt';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { CharacterFullScreen } from '../../../src/components/CharacterFullScreen';
import { useWords } from '../../../src/lib/words';
import {
  COLLECTION_CHIP,
  CollectionHeader,
  CollectionPanel,
} from '../../../src/components/CollectionChrome';
import { colors, fonts } from '../../../src/lib/theme';
import type { ImageSourcePropType } from 'react-native';

const DESIGN_WIDTH = 394;
// Same 3-column card grid as Achievements (Figma frame 1351:819). Card width
// is derived from the panel so rounding can never tip the third card onto the
// next row.
const PANEL = 363;
const CARD_H = 105;
const GRID_INSET = 19;
const GAP = 12;
// −2 accounts for the panel's own borders plus sub-pixel rounding.
const cardWidth = (s: number) => ((PANEL - GRID_INSET * 2 - GAP * 2) * s - 2) / 3 - 1;

// The cast gallery: every finished character illustration on its own card,
// with the word on a chip. Tap the art for full screen, the chip for the entry.
export default function GalleryScreen() {
  const router = useRouter();
  const { bySlug } = useWords();
  const { artFor, castSlugs } = useCharacterArt();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;
  const [search, setSearch] = useState('');
  const [fullScreen, setFullScreen] = useState<{
    source: ImageSourcePropType;
    label: string;
  } | null>(null);

  const cast = useMemo(() => {
    const q = search.trim().toLowerCase();
    return castSlugs
      .map((slug) => ({
        slug,
        term: bySlug.get(slug)?.term ?? slug,
        art: artFor(slug),
      }))
      .filter((c) => !q || c.term.toLowerCase().includes(q))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [bySlug, castSlugs, artFor, search]);

  const fillers = (3 - (cast.length % 3)) % 3;
  const cw = cardWidth(s);

  return (
    <View style={styles.screen}>
      <CollectionHeader
        s={s}
        title="Gallery"
        chipColor={COLLECTION_CHIP.gallery}
        search={search}
        onSearch={setSearch}
      />
      <CollectionPanel s={s}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: GRID_INSET * s,
            gap: GAP * s,
          }}
        >
          {cast.map((c) => (
            <View
              key={c.slug}
              style={[styles.card, { width: cw, height: CARD_H * s, borderRadius: 12 * s }]}
            >
              <Pressable
                onPress={() => setFullScreen({ source: c.art, label: `Illustration for ${c.term}` })}
                accessibilityRole="imagebutton"
                accessibilityLabel={`View ${c.term} full screen`}
              >
                <Image
                  source={c.art}
                  style={{ width: 54 * s, height: 72 * s, marginTop: 8 * s, borderRadius: 6 * s }}
                  resizeMode="cover"
                />
              </Pressable>
              <Pressable
                onPress={() => router.push(`/dictionary/${c.slug}`)}
                accessibilityRole="link"
                accessibilityLabel={`Read the entry for ${c.term}`}
                style={({ pressed }) => [
                  styles.chip,
                  { height: 12 * s, borderRadius: 999, marginTop: 5 * s, paddingHorizontal: 4 * s },
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, { fontSize: 8 * s }]} numberOfLines={1}>
                  {c.term}
                </Text>
              </Pressable>
            </View>
          ))}
          {Array.from({ length: fillers }).map((_, i) => (
            <View
              key={`filler-${i}`}
              style={[styles.card, { width: cw, height: CARD_H * s, borderRadius: 12 * s }]}
            />
          ))}
        </ScrollView>
      </CollectionPanel>

      <CharacterFullScreen
        source={fullScreen?.source ?? COMING_SOON_ART}
        visible={!!fullScreen}
        onClose={() => setFullScreen(null)}
        label={fullScreen?.label ?? ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.progressTrack, alignItems: 'center' },
  chip: {
    backgroundColor: colors.inset,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: { opacity: 0.6 },
  chipText: { fontFamily: fonts.bold, color: colors.text },
});
