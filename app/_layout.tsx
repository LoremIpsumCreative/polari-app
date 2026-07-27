import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { CollectionsProvider } from '../src/lib/collections';
import { RemoteArtProvider } from '../src/lib/remoteArt';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';
import { ProgressProvider } from '../src/lib/progress';
import { colors, DESIGN_HEIGHT, PHONE_MAX_WIDTH } from '../src/lib/theme';
// Resolves to fontAssets.web.ts on web and fontAssets.ts on native.
import { fontAssets } from '../src/lib/fontAssets';
import { installWebFonts } from '../src/lib/webFontFaces';

// Digitale's weight axis has to be pinned per face, which only CSS can express,
// so web declares its own @font-face rules. Run at module scope so the rules are
// in the document before anything renders.
installWebFonts();

// PHONE_MAX_WIDTH caps the app at a smartphone-sized column on web so wide
// browser windows don't stretch the layout; native devices are already
// phone-sized. DESIGN_HEIGHT is the mockups' frame height — below it the
// screens fold in on themselves, so the column never renders shorter and a
// short window scrolls instead. Both live in the theme because the tab bar
// pins itself to the viewport and has to agree on the column width.

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
        <RemoteArtProvider>
        <CollectionsProvider>
        <FavouritesProvider>
          <StreaksProvider>
            <ProgressProvider>
            {Platform.OS === 'web' ? (
              <View style={styles.gutter}>
                <View style={styles.phoneFrame}>{app}</View>
              </View>
            ) : (
              app
            )}
          </ProgressProvider>
          </StreaksProvider>
        </FavouritesProvider>
        </CollectionsProvider>
        </RemoteArtProvider>
      </WordsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    alignItems: 'center',
    // Matches the column's own minimum so the canvas colour covers the whole
    // scrollable document — otherwise a short window scrolls past the gutter
    // and the bare page background shows below it.
    minHeight: DESIGN_HEIGHT,
    backgroundColor: colors.background,
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_MAX_WIDTH,
    minHeight: DESIGN_HEIGHT,
    backgroundColor: colors.background,
  },
});
