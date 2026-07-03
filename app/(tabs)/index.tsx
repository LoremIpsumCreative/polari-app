import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useWords } from '../../src/lib/words';
import { wordOfTheDay } from '../../src/lib/wordOfTheDay';
import { WordDetailCard } from '../../src/components/WordDetailCard';
import { colors, radii, spacing } from '../../src/lib/theme';

export default function TodayScreen() {
  const { words, loading, error, refetch } = useWords();
  const word = useMemo(() => wordOfTheDay(words), [words]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    []
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !word) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load today's word.</Text>
        <Pressable style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{dateLabel}</Text>
      <Text style={styles.heading}>Today's Polari</Text>
      <WordDetailCard word={word} style={styles.card} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
