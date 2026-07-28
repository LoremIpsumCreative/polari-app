import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  IconBinoculars,
  IconColorSwatch,
  IconDeviceMobile,
  IconLogout,
  IconMail,
  IconMoon,
  IconSun,
  IconTrash,
  IconUser,
  IconUserCheck,
} from '@tabler/icons-react-native';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { SpaceHost } from '../../../src/components/illustrations/SpaceHost';
import { colors, radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AccountOption } from '../../../src/components/AccountOption';
import { HEART_RED } from '../../../src/components/CollectionChrome';

// Account/Main (Figma 2154:3235, expanded 2132:3432): a welcome banner at
// y116 over three groups of Button/Account Option rows — profile and
// appearance, about and feedback, sign out — with Delete Account beneath.

// The appearance modes the frame offers. Only Light exists in the app today,
// so the other two render inert rather than pretending to switch themes.
const APPEARANCE_MODES = [
  { key: 'light', label: 'Light Mode', Icon: IconSun, available: true },
  { key: 'dark', label: 'Dark Mode', Icon: IconMoon, available: false },
  { key: 'system', label: 'System', Icon: IconDeviceMobile, available: false },
];

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text style={styles.fieldValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [openSection, setOpenSection] = useState<'profile' | 'appearance' | null>(null);
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

  const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const firstName = meta.first_name ?? session.user.email?.split('@')[0] ?? '';

  return (
    <View style={styles.screenBg}>
      <ScreenBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.banner}>
          Bonyo, <Text style={styles.bannerName}>{firstName}</Text>
        </Text>

        <View style={styles.group}>
          <AccountOption
            label="Profile"
            Icon={IconUser}
            expandable
            expanded={openSection === 'profile'}
            onPress={() => setOpenSection((o) => (o === 'profile' ? null : 'profile'))}
          >
            <ProfileField label="FIRST NAME" value={meta.first_name ?? '—'} />
            <ProfileField label="LAST NAME" value={meta.last_name ?? '—'} />
            <ProfileField label="EMAIL" value={session.user.email ?? '—'} />
            <Pressable
              onPress={() => router.push('/profile/change-password')}
              accessibilityRole="button"
            >
              <Text style={styles.changePassword}>CHANGE PASSWORD</Text>
            </Pressable>
          </AccountOption>

          <AccountOption
            label="Appearance"
            Icon={IconColorSwatch}
            expandable
            expanded={openSection === 'appearance'}
            onPress={() => setOpenSection((o) => (o === 'appearance' ? null : 'appearance'))}
          >
            <View style={styles.modeRow}>
              {APPEARANCE_MODES.map(({ key, label, Icon, available }) => (
                <View
                  key={key}
                  style={[styles.mode, available ? styles.modeActive : styles.modeInert]}
                >
                  <Icon size={12} color={available ? colors.onPrimary : colors.inactive} />
                  <Text style={[styles.modeText, !available && styles.modeTextInert]}>{label}</Text>
                </View>
              ))}
            </View>
          </AccountOption>
        </View>

        <View style={styles.group}>
          <AccountOption
            label="About Polari"
            Icon={IconBinoculars}
            onPress={() => router.push('/profile/about')}
          />
          <AccountOption
            label="Feedback"
            Icon={IconMail}
            onPress={() => router.push('/profile/feedback')}
          />
        </View>

        <View style={styles.group}>
          <AccountOption label="Sign Out" Icon={IconLogout} onPress={signOut} />
          <Pressable onPress={() => setConfirmingDelete(true)} disabled={deleting}>
            <Text style={styles.deleteAccount}>
              {deleting ? 'Deleting…' : 'Delete Account'}
            </Text>
          </Pressable>
          {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
        </View>
      </ScrollView>

      {/* Deletion Confirmation (frame 2144:3536) — a card over a dimmed
          backdrop, replacing the old arm-the-label-then-tap-again confirm. */}
      <Modal
        visible={confirmingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingDelete(false)}
      >
        {/* The backdrop must be a Pressable, not a View: RN-web's Modal
            wrapper sets pointer-events:none and a plain View inherits it,
            leaving every control inside the card dead on web. */}
        <Pressable style={styles.backdrop} onPress={() => setConfirmingDelete(false)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <Text style={styles.confirmTitle}>Are You Sure?</Text>
            <Text style={styles.confirmBody}>
              Your account and its data will be permanently deleted.
            </Text>
            <Text style={styles.confirmWarning}>This action can’t be undone.</Text>

            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setConfirmingDelete(false)}
                style={({ pressed }) => [styles.confirmButton, styles.keepButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.keepBadge}>
                  <IconUserCheck size={14} color={colors.onPrimary} />
                </View>
                <Text style={styles.confirmButtonText}>Keep my account</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={({ pressed }) => [styles.confirmButton, styles.deleteButton, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.deleteBadge}>
                  <IconTrash size={13} color={HEART_RED} />
                </View>
                <Text style={styles.confirmButtonText}>
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Wrapper so the sparkle pattern stays fixed behind the scrolling content.
  screenBg: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Account container x27 y187: three groups 60 apart, rows 8 apart.
  content: {
    paddingHorizontal: 27,
    paddingTop: 116,
    paddingBottom: 120,
  },
  banner: {
    marginLeft: 10,
    marginBottom: 46,
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: 0.3,
    color: colors.text,
  },
  bannerName: { color: colors.primary },
  group: { gap: 8, marginBottom: 60 },

  field: { gap: 6 },
  fieldLabel: {
    marginLeft: 10,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  fieldBox: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  fieldValue: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.3, color: colors.text },
  changePassword: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
    textDecorationLine: 'underline',
  },

  modeRow: { flexDirection: 'row', gap: 8 },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeActive: { backgroundColor: colors.primary },
  modeInert: { backgroundColor: colors.inset },
  modeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.3, color: colors.onPrimary },
  modeTextInert: { color: colors.inactive },

  pressed: { opacity: 0.85 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCard: {
    width: 304,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingTop: 42,
    paddingBottom: 32,
    alignItems: 'center',
  },
  confirmTitle: {
    fontFamily: fonts.display,
    fontSize: 60,
    lineHeight: 58,
    color: colors.text,
    textAlign: 'center',
  },
  confirmBody: {
    marginTop: 32,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.text,
    textAlign: 'center',
  },
  confirmWarning: {
    marginTop: 32,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.text,
    textAlign: 'center',
  },
  confirmActions: { marginTop: 50, gap: 16 },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 240,
    height: 50,
    borderRadius: 999,
    paddingHorizontal: 27,
  },
  keepButton: { backgroundColor: colors.primary },
  deleteButton: { backgroundColor: HEART_RED, justifyContent: 'center', paddingHorizontal: 23 },
  keepBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#FFECEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },

  deleteAccount: {
    marginTop: 24,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.danger,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
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
});
