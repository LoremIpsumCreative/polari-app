import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { CollectionsProvider } from '../src/lib/collections';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';
import { colors } from '../src/lib/theme';
// Resolves to fontAssets.web.ts (woff2) on web and fontAssets.ts (otf) on native.
import { fontAssets } from '../src/lib/fontAssets';

// On web, cap the app at a smartphone-sized column so wide browser windows
// don't stretch the layout. Native devices are already phone-sized.
const PHONE_MAX_WIDTH = 430;

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) return null;

  const app = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );

  return (
    <AuthProvider>
      <WordsProvider>
        <CollectionsProvider>
        <FavouritesProvider>
          <StreaksProvider>
            {Platform.OS === 'web' ? (
              <View style={styles.gutter}>
                <View style={styles.phoneFrame}>{app}</View>
              </View>
            ) : (
              app
            )}
          </StreaksProvider>
        </FavouritesProvider>
        </CollectionsProvider>
      </WordsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_MAX_WIDTH,
    backgroundColor: colors.background,
  },
});
