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

export default function WordDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bySlug, loading } = useWords();
  const { artFor } = useCharacterArt();
  const word = slug ? bySlug.get(slug) : undefined;
  const [artFullScreen, setArtFullScreen] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: word?.term ?? 'Word' }} />
      <View style={styles.screen}>
        <ScreenBackground />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              <WordDetailCard word={word} />
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.missingText}>
                {loading ? 'Loading…' : 'Word not found.'}
              </Text>
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl + 56,
  },
  hero: {
    width: '100%',
    height: 220,
    marginBottom: spacing.md,
  },
  fullScreenButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
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
