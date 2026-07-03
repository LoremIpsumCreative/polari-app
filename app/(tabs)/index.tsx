import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWords } from '../../src/lib/words';
import { wordOfTheDay } from '../../src/lib/wordOfTheDay';
import { WordDetailCard } from '../../src/components/WordDetailCard';
import { useAuth } from '../../src/lib/auth';
import { useStreaks } from '../../src/lib/streaks';
import { colors, radii, spacing, fonts } from '../../src/lib/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { stats, recordEngagement } = useStreaks();
  const { words, loading, error, refetch } = useWords();
  const word = useMemo(() => wordOfTheDay(words), [words]);

  // Viewing today's word is what keeps a streak alive
  useEffect(() => {
    if (session && word) {
      recordEngagement();
    }
  }, [session, word, recordEngagement]);

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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.heading}>Today's Polari</Text>
        </View>
        <Pressable style={styles.streakChip} onPress={() => router.push('/profile')}>
          <Text style={styles.streakText}>
            {session ? `🔥 ${stats?.current_streak ?? 0}` : '🔥 Start a streak'}
          </Text>
        </Pressable>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  date: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  streakChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  streakText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  card: {
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.danger,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
});
