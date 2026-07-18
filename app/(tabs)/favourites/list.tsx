import { useMemo, useRef, useState } from 'react';
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
import { IconHeart, IconHeartFilled } from '@tabler/icons-react-native';
import { useAuth } from '../../../src/lib/auth';
import { useFavourites } from '../../../src/lib/favourites';
import { useWords } from '../../../src/lib/words';
import {
  COLLECTION_CHIP,
  CollectionHeader,
  CollectionPanel,
  HEART_RED,
} from '../../../src/components/CollectionChrome';
import { colors, fonts } from '../../../src/lib/theme';

const favouretteArt = require('../../../assets/collections/favourette.png');

const DESIGN_WIDTH = 394;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Favourites (Figma frames 1153:631 empty / 1153:649 populated): an A–Z
// grouped list inside the white panel, with a tappable alphabet rail.
export default function FavouritesListScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { favouriteWordIds, toggleFavourite } = useFavourites();
  const { words } = useWords();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  const [search, setSearch] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const sectionYs = useRef<Record<string, number>>({});

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const favs = words
      .filter((w) => favouriteWordIds.has(w.id))
      .filter((w) => !q || w.term.toLowerCase().includes(q))
      .sort((a, b) => a.term.localeCompare(b.term));
    const byLetter = new Map<string, typeof favs>();
    for (const w of favs) {
      const letter = (w.term[0] ?? '#').toUpperCase();
      const key = ALPHABET.includes(letter) ? letter : '#';
      if (!byLetter.has(key)) byLetter.set(key, []);
      byLetter.get(key)!.push(w);
    }
    return byLetter;
  }, [words, favouriteWordIds, search]);

  const hasFavourites = favouriteWordIds.size > 0;

  return (
    <View style={styles.screen}>
      <CollectionHeader
        s={s}
        title="Favourites"
        chipColor={COLLECTION_CHIP.favourites}
        search={search}
        onSearch={setSearch}
      />

      <CollectionPanel s={s} width={321}>
        {!session || !hasFavourites ? (
          <View style={{ padding: 20 * s, flex: 1 }}>
            <View style={[styles.row, styles.emptyRow, { height: 40 * s, borderRadius: 8 * s }]}>
              <Text style={[styles.emptyRowText, { fontSize: 12 * s }]}>
                {session ? 'No favourites yet' : 'Sign in to save favourites'}
              </Text>
              <IconHeart size={13 * s} color={colors.inactive} />
            </View>
            <Image
              source={favouretteArt}
              resizeMode="contain"
              style={{ alignSelf: 'center', marginTop: 60 * s, width: 180 * s, height: 325 * s }}
              accessibilityIgnoresInvertColors
            />
            {session ? (
              <Text style={[styles.emptyCaption, { fontSize: 14 * s, lineHeight: 20 * s }]}>
                Save your favourite Polari words and phrases by tapping the heart icon on a word
                definition card.
              </Text>
            ) : (
              <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button">
                <Text style={[styles.emptyCaption, styles.signInLink, { fontSize: 14 * s }]}>
                  Sign in
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 * s, paddingBottom: 32 * s }}
          >
            {[...groups.entries()].map(([letter, items]) => (
              <View
                key={letter}
                onLayout={(e) => {
                  sectionYs.current[letter] = e.nativeEvent.layout.y;
                }}
              >
                <Text style={[styles.letterHeader, { fontSize: 10 * s, paddingVertical: 8 * s, paddingLeft: 14 * s }]}>
                  {letter}
                </Text>
                {items.map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() => router.push(`/dictionary/${w.slug}`)}
                    style={({ pressed }) => [
                      styles.row,
                      { height: 40 * s, borderRadius: 8 * s, marginBottom: 8 * s },
                      pressed && styles.rowPressed,
                    ]}
                    accessibilityRole="link"
                    accessibilityLabel={`Read the entry for ${w.term}`}
                  >
                    <Text style={[styles.rowTerm, { fontSize: 12 * s }]} numberOfLines={1}>
                      {w.term}
                    </Text>
                    <Pressable
                      onPress={() => toggleFavourite(w.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${w.term} from favourites`}
                    >
                      <IconHeartFilled size={14 * s} color={HEART_RED} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </CollectionPanel>

      {/* A–Z rail: tap a letter to jump to its section */}
      <View
        style={[
          styles.rail,
          { right: 13 * s, top: 133 * s, bottom: 49 * s, width: 30 * s, borderRadius: 16 * s },
        ]}
      >
        {ALPHABET.map((letter) => {
          const active = groups.has(letter);
          return (
            <Pressable
              key={letter}
              disabled={!active}
              onPress={() => {
                const y = sectionYs.current[letter];
                if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: true });
              }}
              hitSlop={4}
            >
              <Text
                style={[
                  styles.railLetter,
                  { fontSize: 10 * s },
                  !active && styles.railLetterInactive,
                ]}
              >
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inset,
    borderWidth: 0.5,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 14,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
  rowTerm: { flex: 1, fontFamily: fonts.semibold, color: colors.text },
  emptyRow: { borderColor: colors.inactive },
  emptyRowText: { fontFamily: fonts.semibold, color: colors.inactive },
  emptyCaption: {
    marginTop: 24,
    fontFamily: fonts.semibold,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  signInLink: { color: colors.primary },
  letterHeader: { fontFamily: fonts.regular, color: colors.text },
  rail: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  railLetter: { fontFamily: fonts.bold, color: colors.text },
  railLetterInactive: { color: colors.fieldBorder },
});
