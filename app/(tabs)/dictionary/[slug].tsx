import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useWords } from '../../../src/lib/words';
import { characterArtFor } from '../../../src/lib/characterArt';
import { WordDetailCard } from '../../../src/components/WordDetailCard';
import { colors, spacing, fonts } from '../../../src/lib/theme';

export default function WordDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bySlug, loading } = useWords();
  const word = slug ? bySlug.get(slug) : undefined;

  return (
    <>
      <Stack.Screen options={{ title: word?.term ?? 'Word' }} />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
