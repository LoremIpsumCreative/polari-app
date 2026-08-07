import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { IconArrowsMaximize } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { useCharacterArt } from '../../../src/lib/remoteArt';
import { CharacterFullScreen } from '../../../src/components/CharacterFullScreen';
import { WordDetailCard } from '../../../src/components/WordDetailCard';
import { colors, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

export default function WordDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bySlug, loading } = useWords();
  const { artFor } = useCharacterArt();
  const word = slug ? bySlug.get(slug) : undefined;
  const [artFullScreen, setArtFullScreen] = useState(false);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  return (
    <>
      <Stack.Screen options={{ title: word?.term ?? 'Word' }} />
      <View style={styles.screen}>
        <ScreenBackground />
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
        >
          {word ? (
            <>
              <Image
                source={artFor(word.slug)}
                style={styles.hero}
                resizeMode="contain"
                accessibilityLabel={`Illustration for ${word.term}`}
              />
              <Pressable
                onPress={() => setArtFullScreen(true)}
                style={({ pressed }) => [styles.fullScreenButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="View character full screen"
                hitSlop={10}
              >
                <IconArrowsMaximize size={22} color={colors.textFaint} />
              </Pressable>
              <WordDetailCard word={word} style={styles.card} />
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.missingText}>{loading ? 'Loading…' : 'Word not found.'}</Text>
            </View>
          )}
        </ScrollView>

        {word ? (
          <>
            <CharacterFullScreen
              source={artFor(word.slug)}
              visible={artFullScreen}
              onClose={() => setArtFullScreen(false)}
              label={`Illustration for ${word.term}`}
            />
          </>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
  },
  // Frame 1885:2061: art 190x253 at y87, fullscreen icon at x343 y86, the
  // definition card inset 15 from each edge starting at y350.
  content: {
    // paddingBottom is applied inline from useTabBarInset — the floating tab
    // bar's height varies with the device's safe-area inset, so it cannot be a
    // static value here.
  },
  hero: {
    alignSelf: 'center',
    width: 190,
    height: 253,
    marginTop: 87,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 86,
    right: 31,
    padding: spacing.xs,
  },
  card: {
    marginHorizontal: 15,
    marginTop: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  center: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  missingText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
});
