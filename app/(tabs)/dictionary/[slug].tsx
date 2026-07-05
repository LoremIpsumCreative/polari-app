import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { IconArrowsMaximize } from '@tabler/icons-react-native';
import { useWords } from '../../../src/lib/words';
import { characterArtFor } from '../../../src/lib/characterArt';
import { CharacterFullScreen } from '../../../src/components/CharacterFullScreen';
import { WordDetailCard } from '../../../src/components/WordDetailCard';
import { colors, spacing, fonts } from '../../../src/lib/theme';

export default function WordDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bySlug, loading } = useWords();
  const word = slug ? bySlug.get(slug) : undefined;
  const [artFullScreen, setArtFullScreen] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: word?.term ?? 'Word' }} />
      <View style={styles.screen}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {word ? (
            <>
              <Image
                source={characterArtFor(word.slug)}
                style={styles.hero}
                resizeMode="contain"
                accessibilityLabel={`Illustration for ${word.term}`}
              />
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
            <Pressable
              onPress={() => setArtFullScreen(true)}
              style={({ pressed }) => [styles.fullScreenButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="View character full screen"
              hitSlop={10}
            >
              <IconArrowsMaximize size={22} color={colors.textFaint} />
            </Pressable>
            <CharacterFullScreen
              source={characterArtFor(word.slug)}
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
    top: spacing.md + spacing.xs,
    right: spacing.md + spacing.xs,
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
