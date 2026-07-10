import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/lib/auth';
import { useFavourites } from '../../../src/lib/favourites';
import { useWords } from '../../../src/lib/words';
import { SpaceHost } from '../../../src/components/illustrations/SpaceHost';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

export default function FavouritesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { favouriteWordIds } = useFavourites();
  const { words } = useWords();

  const favouriteWords = useMemo(
    () => words.filter((w) => favouriteWordIds.has(w.id)),
    [words, favouriteWordIds]
  );

  if (!session) {
    return (
      <View style={styles.center}>
        <SpaceHost width={200} />
        <Text style={styles.emptyTitle}>Save your favourite Polari</Text>
        <Text style={styles.emptyBody}>
          Sign in to favourite words and find them again here.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (favouriteWords.length === 0) {
    return (
      <View style={styles.center}>
        <SpaceHost width={200} />
        <Text style={styles.emptyTitle}>Nanti favourites yet</Text>
        <Text style={styles.emptyBody}>
          Vada the Dictionary and tap the ♡ on any word that takes your fancy.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={favouriteWords}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.rowHeart}>♥</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  listContent: {
    padding: spacing.md,
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
  rowHeart: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.danger,
    marginLeft: spacing.sm,
  },
});
