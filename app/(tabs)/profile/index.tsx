import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useStreaks } from '../../../src/lib/streaks';
import { SpaceHost } from '../../../src/components/illustrations/SpaceHost';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { stats } = useStreaks();
  // Two-step confirm (RN Alert is a no-op on web, so an inline confirm state
  // works everywhere)
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      setDeleting(false);
      setDeleteError('Could not delete your account. Please try again.');
      return;
    }
    // Server-side user is gone; clear the local session
    await signOut();
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <SpaceHost width={200} />
        <Text style={styles.emptyTitle}>Your Polari journey</Text>
        <Text style={styles.emptyBody}>
          Sign in to track streaks, save favourites, and record quiz high scores.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/sign-in')}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/sign-up')}>
          <Text style={styles.link}>
            New here? <Text style={styles.linkStrong}>Create an account</Text>
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/profile/about')}>
          <Text style={styles.link}>
            Curious? <Text style={styles.linkStrong}>Read the story of Polari</Text>
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.email}>{session.user.email}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Current streak" value={`${stats?.current_streak ?? 0}🔥`} />
        <StatCard label="Longest streak" value={stats?.longest_streak ?? 0} />
        <StatCard label="Words learned" value={stats?.words_learned_count ?? 0} />
      </View>
      {stats && stats.streak_freezes > 0 ? (
        <Text style={styles.freezeNote}>
          ❄️ {stats.streak_freezes === 1 ? 'A streak freeze' : `${stats.streak_freezes} streak freezes`} in
          the bank — one missed day won't break you. Another arrives every 7-day milestone.
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.rowButton, pressed && styles.rowPressed]}
        onPress={() => router.push('/profile/about')}
      >
        <Text style={styles.rowButtonText}>📖 About Polari — the story & sources</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.rowButton, pressed && styles.rowPressed]}
        onPress={() => router.push('/profile/feedback')}
      >
        <Text style={styles.rowButtonText}>💌 Send feedback</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          confirmingDelete && styles.deleteButtonArmed,
          pressed && styles.signOutPressed,
        ]}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        <Text style={styles.deleteText}>
          {deleting
            ? 'Deleting…'
            : confirmingDelete
              ? 'Tap again to permanently delete'
              : 'Delete account'}
        </Text>
      </Pressable>
      {confirmingDelete && !deleting ? (
        <Pressable onPress={() => setConfirmingDelete(false)}>
          <Text style={styles.cancelDelete}>Never mind, keep my account</Text>
        </Pressable>
      ) : null}
      {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
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
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  freezeNote: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  link: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  linkStrong: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  rowButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowButtonText: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  signOutButton: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  deleteButton: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  deleteButtonArmed: {
    borderColor: colors.danger,
    backgroundColor: colors.blushSoft,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  cancelDelete: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  deleteError: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  signOutPressed: {
    backgroundColor: colors.primarySoft,
  },
  signOutText: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
});
