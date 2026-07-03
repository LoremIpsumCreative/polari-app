import { Stack } from 'expo-router';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WordsProvider>
        <FavouritesProvider>
          <StreaksProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </StreaksProvider>
        </FavouritesProvider>
      </WordsProvider>
    </AuthProvider>
  );
}
