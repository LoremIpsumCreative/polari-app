import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { useFavourites } from '../lib/favourites';
import { colors, radii, spacing } from '../lib/theme';

export function FavouriteButton({ wordId }: { wordId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  const favourited = isFavourite(wordId);

  function handlePress() {
    if (!session) {
      // Favouriting needs an account — send signed-out users to sign-in
      router.push('/sign-in');
      return;
    }
    toggleFavourite(wordId);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel={favourited ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Text style={[styles.heart, favourited && styles.heartActive]}>
        {favourited ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 'auto',
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  buttonPressed: {
    backgroundColor: colors.primarySoft,
  },
  heart: {
    fontSize: 24,
    color: colors.textMuted,
  },
  heartActive: {
    color: colors.danger,
  },
});
