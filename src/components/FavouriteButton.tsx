import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react-native';
import { useAuth } from '../lib/auth';
import { useFavourites } from '../lib/favourites';
import { colors, radii } from '../lib/theme';

export function FavouriteButton({ wordId }: { wordId: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const { isFavourite, toggleFavourite } = useFavourites();
  const favourited = isFavourite(wordId);

  function handlePress() {
    if (!session) {
      // Favouriting needs an account — send signed-out users to sign-in
      router.push('/profile/sign-in');
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
      hitSlop={10}
    >
      {favourited ? (
        <IconHeartFilled size={20} color={colors.heart} />
      ) : (
        <IconHeart size={20} color={colors.textFaint} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 0,
    borderRadius: radii.sm,
  },
  buttonPressed: {
    opacity: 0.6,
  },
});
