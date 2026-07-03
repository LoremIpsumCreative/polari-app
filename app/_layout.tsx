import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';
import { colors } from '../src/lib/theme';

// On web, cap the app at a smartphone-sized column so wide browser windows
// don't stretch the layout. Native devices are already phone-sized.
const PHONE_MAX_WIDTH = 430;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Digitale-Regular': require('../assets/fonts/Digitale-Regular.otf'),
    'Digitale-Italic': require('../assets/fonts/Digitale-Italic.otf'),
    'Digitale-Semibold': require('../assets/fonts/Digitale-Semibold.otf'),
    'Digitale-Bold': require('../assets/fonts/Digitale-Bold.otf'),
    'Digitale-Extrabold': require('../assets/fonts/Digitale-Extrabold.otf'),
  });

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
      </WordsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_MAX_WIDTH,
    backgroundColor: colors.background,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
