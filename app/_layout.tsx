import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Digitale-Regular': require('../assets/fonts/Digitale-Regular.otf'),
    'Digitale-Italic': require('../assets/fonts/Digitale-Italic.otf'),
    'Digitale-Semibold': require('../assets/fonts/Digitale-Semibold.otf'),
    'Digitale-Bold': require('../assets/fonts/Digitale-Bold.otf'),
    'Digitale-Extrabold': require('../assets/fonts/Digitale-Extrabold.otf'),
  });

  if (!fontsLoaded) return null;

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
