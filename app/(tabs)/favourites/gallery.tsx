import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COMING_SOON_ART } from '../../../src/lib/characterArt';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { CharacterFullScreen } from '../../../src/components/CharacterFullScreen';
import { useWords } from '../../../src/lib/words';
import { CollectionHeader, CollectionPanel } from '../../../src/components/CollectionChrome';
import type { Palette } from '../../../src/lib/palette';
import { useThemedStyles } from '../../../src/lib/appearance';
import { fonts } from '../../../src/lib/theme';
import { useDesignScale } from '../../../src/lib/designScale';
import { ScreenBackground } from '../../../src/components/ScreenBackground';

// Same 3-column card grid as Achievements (Figma frame 1351:819). Card width
// is derived from the panel so rounding can never tip the third card onto the
// next row.
const PANEL = 363;
const CARD_H = 105;
const GRID_INSET = 19;
const GAP = 12;
// −2 accounts for the panel's own borders plus sub-pixel rounding.
const cardWidth = (s: number) => ((PANEL - GRID_INSET * 2 - GAP * 2) * s - 2) / 3 - 1;

const COLUMNS = 3;
// One row of cards above and below the viewport are treated as on screen, so a
// flick never lands on an empty card while its art is still arriving.
const OVERSCAN_ROWS = 1;

// Which rows of the grid are worth loading art for.
//
// Every card in the bucket used to mount its <Image> the moment this screen
// did — one request per character, ~37 of them, for the dozen or so actually
// in front of the reader. Off-screen images are not free on any platform, and
// on web least of all: react-native-web's <Image> fetches through its own
// ImageLoader and paints the result as a CSS background, so the browser's
// loading="lazy" never gets a look in. The rows have to be worked out here.
//
// No measurement is needed for that. The grid is fixed: three columns, every
// card CARD_H tall, GAP between rows, GRID_INSET at the top. So a card's row is
// its index over three, and that row's offset is arithmetic.
function visibleRows(scrollY: number, viewportHeight: number, s: number) {
  const rowHeight = (CARD_H + GAP) * s;
  const top = scrollY - GRID_INSET * s;
  const first = Math.floor(top / rowHeight) - OVERSCAN_ROWS;
  const last = Math.ceil((top + viewportHeight) / rowHeight) + OVERSCAN_ROWS;
  return { first: Math.max(0, first), last };
}

// The cast gallery: every finished character illustration on its own card,
// with the word on a chip. Tap the art for full screen, the chip for the entry.
export default function GalleryScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { bySlug } = useWords();
  const { artFor, castSlugs } = useCharacterArt();
  const s = useDesignScale();
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

  // The scroll window, kept as row numbers rather than pixels so it only
  // changes when a new row of cards comes into play — a few times a flick,
  // not on every scroll frame.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [rows, setRows] = useState({ first: 0, last: 0 });
  // Read by the recompute below, so it is a ref rather than state: the scroll
  // offset itself never needs to cause a render.
  const scrollY = useRef(0);

  const trackRows = useCallback(
    (height: number) => {
      if (height === 0) return;
      const next = visibleRows(scrollY.current, height, s);
      setRows((prev) => (prev.first === next.first && prev.last === next.last ? prev : next));
    },
    [s],
  );

  // Row height is in scaled units, so a window resize moves the boundaries even
  // when nothing has scrolled.
  useEffect(() => {
    trackRows(viewportHeight);
  }, [trackRows, viewportHeight]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
      trackRows(viewportHeight);
    },
    [trackRows, viewportHeight],
  );

  const fillers = (COLUMNS - (cast.length % COLUMNS)) % COLUMNS;
  const cw = cardWidth(s);

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <CollectionHeader title="Gallery" search={search} onSearch={setSearch} />
      <CollectionPanel s={s}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onLayout={onLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: GRID_INSET * s,
            gap: GAP * s,
          }}
        >
          {cast.map((c, i) => {
            const row = Math.floor(i / COLUMNS);
            const onScreen = row >= rows.first && row <= rows.last;
            return (
              <View
                key={c.slug}
                style={[styles.card, { width: cw, height: CARD_H * s, borderRadius: 12 * s }]}
              >
                <Pressable
                  onPress={() =>
                    setFullScreen({ source: c.art, label: `Illustration for ${c.term}` })
                  }
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`View ${c.term} full screen`}
                >
                  {/* The well is always drawn; only the art inside it waits for
                    the card to come into view. Swapping the whole Pressable
                    out would make rows off screen untappable and would change
                    what a screen reader finds. */}
                  <View
                    style={{ width: 54 * s, height: 72 * s, marginTop: 8 * s, borderRadius: 6 * s }}
                  >
                    {onScreen ? (
                      <Image
                        source={c.art}
                        style={{ width: '100%', height: '100%', borderRadius: 6 * s }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/dictionary/${c.slug}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`Read the entry for ${c.term}`}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      height: 12 * s,
                      borderRadius: 999,
                      marginTop: 5 * s,
                      paddingHorizontal: 4 * s,
                    },
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipText, { fontSize: 8 * s }]} numberOfLines={1}>
                    {c.term}
                  </Text>
                </Pressable>
              </View>
            );
          })}
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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
