import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAchievements, type Achievement } from '../../../src/lib/achievements';
import {
  COLLECTION_CHIP,
  CollectionHeader,
  CollectionPanel,
} from '../../../src/components/CollectionChrome';
import { colors, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';

const DESIGN_WIDTH = 394;
// 3 columns of cards inside the 363 panel: 19 inset, 12 gutters (Figma frame
// 1351:723). Card width derives from the panel so rounding can never tip the
// third card onto the next row.
const PANEL = 363;
const CARD_H = 105;
const GRID_INSET = 19;
const GAP = 12;
const LOCKED_INK = '#B3B9C4';
// −2 accounts for the panel's own borders plus sub-pixel rounding.
const cardWidth = (s: number) => ((PANEL - GRID_INSET * 2 - GAP * 2) * s - 2) / 3 - 1;

function AchievementCard({ a, s }: { a: Achievement; s: number }) {
  const pct = a.target > 0 ? a.current / a.target : 0;
  return (
    <View style={[styles.card, { width: cardWidth(s), height: CARD_H * s, borderRadius: 12 * s }]}>
      <View
        style={[
          styles.cardIcon,
          { width: 37 * s, height: 37 * s, borderRadius: 19 * s, marginTop: 10 * s },
          a.earned ? styles.cardIconEarned : styles.cardIconLocked,
        ]}
      >
        <a.Icon size={17 * s} color={a.earned ? colors.primary : LOCKED_INK} />
      </View>
      <View style={[styles.bar, { width: 59 * s, height: 10 * s, marginTop: 9 * s }]}>
        <View
          style={[
            styles.barFill,
            { width: Math.max(0.08, Math.min(1, pct)) * 55 * s, height: 6 * s, borderRadius: 12 * s },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { fontSize: 7 * s, marginTop: 4 * s }]}>
        {a.current} of {a.target}
      </Text>
      <Text
        style={[
          styles.cardName,
          { fontSize: 10 * s, marginTop: 12 * s, color: a.earned ? colors.text : LOCKED_INK },
        ]}
        numberOfLines={1}
      >
        {a.title}
      </Text>
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, signedIn } = useAchievements();
  const { width } = useWindowDimensions();
  const s = Math.min(width, 430) / DESIGN_WIDTH;
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? achievements.filter((a) => a.title.toLowerCase().includes(q)) : achievements;
  }, [achievements, search]);

  // Pad the grid with empty slots so the last row stays a full three across.
  const fillers = (3 - (visible.length % 3)) % 3;

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <CollectionHeader
        s={s}
        title="Achievements"
        chipColor={COLLECTION_CHIP.achievements}
        search={search}
        onSearch={setSearch}
      />
      <CollectionPanel s={s}>
        {!signedIn ? (
          <View style={{ padding: 20 * s, flex: 1 }}>
            <View style={[styles.gateRow, { height: 40 * s, borderRadius: 8 * s }]}>
              <Text style={[styles.gateText, { fontSize: 12 * s }]}>
                Sign in to earn achievements
              </Text>
            </View>
            <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button">
              <Text style={[styles.gateLink, { fontSize: 14 * s }]}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              padding: GRID_INSET * s,
              gap: GAP * s,
            }}
          >
            {visible.map((a) => (
              <AchievementCard key={a.id} a={a} s={s} />
            ))}
            {Array.from({ length: fillers }).map((_, i) => (
              <View
                key={`filler-${i}`}
                style={[styles.card, { width: cardWidth(s), height: CARD_H * s, borderRadius: 12 * s }]}
              />
            ))}
          </ScrollView>
        )}
      </CollectionPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.progressTrack, alignItems: 'center' },
  cardIcon: { alignItems: 'center', justifyContent: 'center' },
  cardIconEarned: { backgroundColor: colors.primarySoft },
  cardIconLocked: { backgroundColor: colors.inset, borderWidth: 0.5, borderColor: colors.fieldBorder },
  bar: {
    borderWidth: 0.5,
    borderColor: colors.inactive,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  barFill: { backgroundColor: colors.textMuted },
  progressText: { fontFamily: fonts.extrabold, color: colors.text },
  cardName: { fontFamily: fonts.semibold, paddingHorizontal: 4 },
  gateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inset,
    borderWidth: 0.5,
    borderColor: colors.inactive,
  },
  gateText: { fontFamily: fonts.semibold, color: colors.inactive },
  gateLink: {
    marginTop: 24,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
});
