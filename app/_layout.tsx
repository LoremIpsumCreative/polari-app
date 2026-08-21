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

// Every screen places its children absolutely in the mockups' 393-wide space,
// so the root's whole job is to work out where that box lands on this device
// and draw the navigator into exactly it — see useDesignFrame. Everything
// inside then shares one scale and stays in register.
//
// The box is as wide as the viewport (capped at a phone's width) and at least
// as tall as the scaled 852 design. Two cases follow from that:
//
//   Fits — every phone in portrait. The frame takes the viewport's height
//   exactly and is anchored to the BOTTOM, so the tab bar meets the glass and
//   nothing scrolls. Slack falls at the top, where the frames draw nothing but
//   the status bar.
//
//   Too short — a small window, or a phone in landscape. The frame keeps the
//   design's height so screens are not cut off at the foot, anchors to the TOP,
//   and the gutter scrolls. Anchoring to the bottom here would push the
//   overflow off the top of a flex container, where scrolling cannot reach it,
//   and the title of every screen would simply vanish.
//
// The gutter is painted in the canvas colour so any letterbox reads as part of
// the app rather than as a cropped page.

// The letterbox and the frame it surrounds are the two surfaces the root owns,
// and they follow the reader's appearance choice like everything else now that
// the per-area migration is finished — see src/lib/palette.ts.
function AppFrame({ children }: { children: ReactNode }) {
  const frame = useDesignFrame();
  const { colors: themed } = useAppearance();
  return (
    <View
      style={[
        styles.gutter,
        frame.overflows && styles.gutterScrolls,
        { backgroundColor: themed.canvas },
      ]}
    >
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
    // backgroundColor comes from AppFrame — the gutter follows the appearance
    // choice, so a static value here would only ever be overridden.
  },
  // Only when the viewport is shorter than the design. Bottom-anchoring would
  // push the overflow off the TOP, where a flex container cannot scroll to it —
  // the screen's title and search row simply vanish. Anchoring to the top
  // instead puts the overflow at the foot, which scrolling can reach.
  gutterScrolls: { justifyContent: 'flex-start', overflow: 'scroll' },
  phoneFrame: {
    // Sized from useDesignFrame at the call site. Deliberately NOT flex: the
    // box has to be exactly the design's aspect for the absolute coordinates
    // inside it to land where the frames put them.
    overflow: 'hidden',
    // As above: AppFrame supplies the themed background.
  },
});
