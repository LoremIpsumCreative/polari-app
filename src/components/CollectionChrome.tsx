import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconChevronLeft, IconSearch } from '@tabler/icons-react-native';
import { colors, fonts } from '../lib/theme';
import { useTabBarInset } from './AnimatedTabBar';

// Shared chrome for the Collections sub-screens, rebuilt against the current
// frames (Favourites 1858:1480, Achievements 1859:933, Gallery 1859:1566):
// a "Collections" back chip at y52, a plain centred Mouse Memoirs title at
// y90, the full-width search field at y129, and the white panel from y203.
// The coloured title chip the earlier section used is gone.

export const HEART_RED = '#C9372C';
export const TROPHY_GOLD = '#CF9F02';

export function CollectionHeader({
  title,
  search,
  onSearch,
}: {
  title: string;
  search?: string;
  onSearch?: (text: string) => void;
}) {
  const router = useRouter();
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/favourites'))}
        accessibilityRole="button"
        accessibilityLabel="Back to Collections"
      >
        <IconChevronLeft size={10} color={colors.text} />
        <Text style={styles.backText}>Collections</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      {onSearch ? (
        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={onSearch}
            style={styles.searchInput}
            accessibilityLabel={`Search ${title.toLowerCase()}`}
          />
          {/* The frame parks the affordance on the right of the field. */}
          <View style={styles.searchHint} pointerEvents="none">
            {!search && <Text style={styles.searchHintText}>Search</Text>}
            <IconSearch size={12} color={colors.text} />
          </View>
        </View>
      ) : null}
    </>
  );
}

// The white rounded panel every sub-screen scrolls its content inside.
export function CollectionPanel({
  s,
  children,
  width,
}: {
  s: number;
  children: ReactNode;
  width?: number; // design units; defaults to full width minus margins
}) {
  const tabInset = useTabBarInset();
  return (
    <View
      style={[
        styles.panel,
        {
          left: 18 * s,
          top: 203 * s,
          bottom: 49 * s + tabInset,
          width: (width ?? 360) * s,
          borderRadius: 14 * s,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Back chip — "Collections button", x17 y52 w94 h31.
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 52,
    marginLeft: 17,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.inset,
  },
  backText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.3, color: colors.text },
  pressed: { opacity: 0.7 },

  // Page Title — centred at y90, the same treatment as the Dictionary title.
  title: {
    marginTop: 7,
    fontFamily: fonts.display,
    fontSize: 36,
    // 40 rather than 44 so the search field still lands on the frame's y129.
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
  },

  // Input/Search — x18 y129 w360.
  searchWrap: { marginHorizontal: 18, marginTop: 0, justifyContent: 'center' },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    paddingRight: 34,
    backgroundColor: colors.surface,
    borderRadius: 999,
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

  panel: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    overflow: 'hidden',
  },
});
