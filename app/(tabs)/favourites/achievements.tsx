import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconTrophy } from '@tabler/icons-react-native';
import { useAchievements, type Achievement } from '../../../src/lib/achievements';
import { SpaceHost } from '../../../src/components/illustrations/SpaceHost';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

function Badge({ a }: { a: Achievement }) {
  const pct = a.target > 0 ? a.current / a.target : 0;
  return (
    <View style={[styles.badge, a.earned && styles.badgeEarned]}>
      <View style={[styles.badgeIcon, a.earned && styles.badgeIconEarned]}>
        <a.Icon size={22} color={a.earned ? colors.primary : colors.textFaint} />
      </View>
      <Text style={styles.badgeTitle} numberOfLines={1}>
        {a.title}
      </Text>
      <Text style={styles.badgeDescription} numberOfLines={2}>
        {a.description}
      </Text>
      {a.earned ? (
        <Text style={styles.badgeEarnedText}>Earned ✓</Text>
      ) : (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {a.current}/{a.target}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, earnedCount, signedIn } = useAchievements();

  if (!signedIn) {
    return (
      <View style={styles.center}>
        <SpaceHost width={200} />
        <Text style={styles.emptyTitle}>Trophies want an owner</Text>
        <Text style={styles.emptyBody}>
          Sign in to earn badges for streaks, quiz wins and words mastered.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <IconTrophy size={26} color={colors.primary} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>
            {earnedCount} of {achievements.length} earned
          </Text>
          <Text style={styles.summarySub}>
            {earnedCount === achievements.length
              ? 'The full set — fantabulosa, ducky!'
              : 'Keep vada-ing, quizzing and streaking.'}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {achievements.map((a) => (
          <Badge key={a.id} a={a} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl + 96 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.onPrimary, fontFamily: fonts.semibold },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  summarySub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    // Two columns with one gap between them
    flexBasis: '48.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  badgeEarned: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inset,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeIconEarned: {
    backgroundColor: colors.surface,
  },
  badgeTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  badgeDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    minHeight: 32,
  },
  badgeEarnedText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.inset,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textFaint,
    minWidth: 34,
    textAlign: 'right',
  },
});
