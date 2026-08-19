import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/lib/auth';
import { WordsProvider } from '../src/lib/words';
import { CollectionsProvider } from '../src/lib/collections';
import { RemoteArtProvider } from '../src/lib/remoteArt';
import { FavouritesProvider } from '../src/lib/favourites';
import { StreaksProvider } from '../src/lib/streaks';
import { ProgressProvider } from '../src/lib/progress';
import { colors } from '../src/lib/theme';
import { useDesignFrame } from '../src/lib/designScale';
// Resolves to fontAssets.web.ts on web and fontAssets.ts on native.
import { fontAssets } from '../src/lib/fontAssets';
import { installWebFonts } from '../src/lib/webFontFaces';
import { LaunchScreen } from '../src/components/LaunchScreen';
import { ContentAdvisory } from '../src/components/ContentAdvisory';
import { PrivacyGate } from '../src/components/PrivacyGate';
import { CompleteProfileGate } from '../src/components/CompleteProfileGate';
import { DisplayNameProvider } from '../src/lib/displayName';
import { AppearanceProvider, useAppearance } from '../src/lib/appearance';
import { Analytics } from '../src/components/Analytics';

// Digitale's weight axis has to be pinned per face, which only CSS can express,
// so web declares its own @font-face rules. Run at module scope so the rules are
// in the document before anything renders.
installWebFonts();

// The app is one fixed-aspect drawing: every screen places its children
// absolutely in the mockups' 393x852 space. So the root's whole job is to work
// out where that frame lands on this device and draw the navigator into exactly
// that box — see useDesignFrame. Everything inside then shares one scale and
// stays in register.
//
// The box is centred horizontally and anchored to the BOTTOM. Bottom-anchoring
// is what keeps the tab bar (frame y751-852) flush with the physical bottom
// edge; the slack goes to the top, where the frames draw nothing but the status
// bar. The surrounding gutter is painted in the canvas colour so the letterbox
// reads as part of the app rather than as a cropped page.
//
// This replaces a `minHeight: 852` column applied on web only. That column
// could not be shorter than the design, so any viewport under 852 tall scrolled
// — taking the tab bar with it, below the fold.

// The letterbox and the frame it surrounds are the only surfaces the root
// owns, so they are the first two to follow the reader's appearance choice.
// Everything inside still reads the static light palette until each screen is
// migrated to useColors() — see src/lib/palette.ts.
function AppFrame({ children }: { children: ReactNode }) {
  const frame = useDesignFrame();
  const { colors: themed } = useAppearance();
  return (
    <View style={[styles.gutter, { backgroundColor: themed.canvas }]}>
      <View
        style={[
          styles.phoneFrame,
          { width: frame.width, height: frame.height, backgroundColor: themed.canvas },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  // Component state is exactly the right lifetime here: it resets on a cold
  // start, which is when the launch sequence is meant to play, and survives
  // navigation within a session, which is when it must not.
  const [launched, setLaunched] = useState(false);
  // The advisory follows the launch sequence and gates the app behind itself.
  const [advised, setAdvised] = useState(false);
  // Then the privacy policy, then — signed in only — a display name. Each
  // gate renders over the last, so they arrive in order without a router.
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [namedSelf, setNamedSelf] = useState(false);

  if (!fontsLoaded) return null;

  // The app mounts underneath the launch screen rather than after it, so the
  // dictionary and artwork are already fetched by the time Open is tapped.
  const app = (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      {launched ? null : <LaunchScreen onOpen={() => setLaunched(true)} />}
      {launched && !advised ? <ContentAdvisory onAcknowledge={() => setAdvised(true)} /> : null}
      {launched && advised && !agreedPrivacy ? (
        <PrivacyGate onAgree={() => setAgreedPrivacy(true)} />
      ) : null}
      {/* Signed-out readers have no profile to complete; the gate returns
          null for them rather than the layout having to know. */}
      {launched && advised && agreedPrivacy && !namedSelf ? (
        <CompleteProfileGate onDone={() => setNamedSelf(true)} />
      ) : null}
      {/* Web-only in practice: the native build resolves this to a no-op. */}
      <Analytics />
    </>
  );

  return (
    <AppearanceProvider>
      <AuthProvider>
        <WordsProvider>
          <RemoteArtProvider>
            <CollectionsProvider>
              <FavouritesProvider>
                <DisplayNameProvider>
                  <StreaksProvider>
                    <ProgressProvider>
                      <AppFrame>{app}</AppFrame>
                    </ProgressProvider>
                  </StreaksProvider>
                </DisplayNameProvider>
              </FavouritesProvider>
            </CollectionsProvider>
          </RemoteArtProvider>
        </WordsProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    alignItems: 'center',
    // Bottom-anchored, so the frame's foot — and the tab bar sitting on it —
    // meets the physical bottom of the screen.
    justifyContent: 'flex-end',
    backgroundColor: colors.canvas,
  },
  phoneFrame: {
    // Sized from useDesignFrame at the call site. Deliberately NOT flex: the
    // box has to be exactly the design's aspect for the absolute coordinates
    // inside it to land where the frames put them.
    overflow: 'hidden',
    backgroundColor: colors.canvas,
  },
});
