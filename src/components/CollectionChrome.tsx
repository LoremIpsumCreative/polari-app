import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconChevronLeft, IconSearch } from '@tabler/icons-react-native';
import { colors, fonts } from '../lib/theme';

// Shared chrome for the Collections sub-screens (Figma section 1117:1577):
// "◀ Collections" back chip, a Mouse Memoirs title chip in the screen's
// accent colour, a right-aligned search pill, and the white content panel.
// All geometry is in the mockups' 394-wide design space, scaled by `s`.

export const COLLECTION_CHIP = {
  favourites: '#F797D2',
  achievements: '#F5CD47',
  gallery: '#9DD9EE',
} as const;

export const HEART_RED = '#C9372C';
export const TROPHY_GOLD = '#CF9F02';

export function CollectionHeader({
  s,
  title,
  chipColor,
  search,
  onSearch,
}: {
  s: number;
  title: string;
  chipColor: string;
  search?: string;
  onSearch?: (text: string) => void;
}) {
  const router = useRouter();
  return (
    <>
      <Pressable
        style={[styles.backChip, { left: 17 * s, top: 23 * s, height: 28 * s }]}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/favourites'))}
        accessibilityRole="button"
        accessibilityLabel="Back to Collections"
      >
        <IconChevronLeft size={10 * s} color={colors.text} />
        <Text style={[styles.backText, { fontSize: 10 * s }]}>Collections</Text>
      </Pressable>

      {onSearch ? (
        <View
          style={[
            styles.searchPill,
            { right: 13 * s, top: 23 * s, width: 175 * s, height: 28 * s },
          ]}
        >
          <TextInput
            value={search}
            onChangeText={onSearch}
            placeholder="Search"
            placeholderTextColor={colors.inactive}
            style={[styles.searchInput, { fontSize: 10 * s }]}
            accessibilityLabel={`Search ${title.toLowerCase()}`}
          />
          <IconSearch size={10 * s} color={colors.inactive} />
        </View>
      ) : null}

      <View
        style={[
          styles.titleChip,
          { left: 17 * s, top: 68 * s, height: 55 * s, borderRadius: 8 * s, backgroundColor: chipColor },
        ]}
      >
        <Text style={[styles.titleText, { fontSize: 34 * s }]}>{title}</Text>
      </View>
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
  return (
    <View
      style={[
        styles.panel,
        {
          left: 17 * s,
          top: 133 * s,
          bottom: 49 * s,
          width: (width ?? 363) * s,
          borderRadius: 14 * s,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backChip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: fonts.bold, color: colors.text, letterSpacing: 0.3 },
  searchPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.inactive,
    borderRadius: 999,
    paddingHorizontal: 12,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.semibold,
    color: colors.text,
    textAlign: 'right',
    paddingVertical: 0,
  },
  titleChip: {
    position: 'absolute',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  titleText: { fontFamily: fonts.display, color: colors.quizInk },
  panel: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    overflow: 'hidden',
  },
});
