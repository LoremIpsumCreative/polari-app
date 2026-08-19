import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import IconBinoculars from '@tabler/icons-react-native/IconBinoculars';
import IconColorSwatch from '@tabler/icons-react-native/IconColorSwatch';
import IconDeviceMobile from '@tabler/icons-react-native/IconDeviceMobile';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconMail from '@tabler/icons-react-native/IconMail';
import IconMoon from '@tabler/icons-react-native/IconMoon';
import IconShield from '@tabler/icons-react-native/IconShield';
import IconSun from '@tabler/icons-react-native/IconSun';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconUser from '@tabler/icons-react-native/IconUser';
import IconUserCheck from '@tabler/icons-react-native/IconUserCheck';
import Constants from 'expo-constants';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { useDisplayName } from '../../../src/lib/displayName';
import { useAppearance, type AppearanceMode } from '../../../src/lib/appearance';
import type { Palette } from '../../../src/lib/palette';
import { useColors, useThemedStyles } from '../../../src/lib/appearance';
import { radii, spacing, fonts } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { AccountOption } from '../../../src/components/AccountOption';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';
import { HEART_RED } from '../../../src/components/CollectionChrome';

// Account/Main (Figma 2154:3235, expanded 2132:3432): a welcome banner at
// y116 over three groups of Button/Account Option rows — profile and
// appearance, about and feedback, sign out — with Delete Account beneath.

// The appearance modes the frame offers, in its order.
const APPEARANCE_MODES: { key: AppearanceMode; label: string; Icon: typeof IconSun }[] = [
  { key: 'light', label: 'Light Mode', Icon: IconSun },
  { key: 'dark', label: 'Dark Mode', Icon: IconMoon },
  { key: 'system', label: 'System', Icon: IconDeviceMobile },
];

// The selector the Appearance row expands to reveal. Both the signed-in and
// signed-out branches draw it, so it lives here rather than twice inline.
//
// The choice is stored and resolved immediately, System following the OS. The
// Account area repaints with it; the areas still on the static palette join as
// they are migrated, and nothing here changes when they do.
function AppearanceModes() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { mode, setMode } = useAppearance();
  return (
    <View style={styles.modeRow} accessibilityRole="radiogroup">
      {APPEARANCE_MODES.map(({ key, label, Icon }) => {
        const selected = mode === key;
        return (
          <Pressable
            key={key}
            onPress={() => setMode(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            style={({ pressed }) => [
              styles.mode,
              selected ? styles.modeActive : styles.modeIdle,
              pressed && styles.pressed,
            ]}
          >
            <Icon size={12} color={selected ? colors.onPrimary : colors.text} />
            <Text style={[styles.modeText, !selected && styles.modeTextIdle]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A profile row the reader can edit in place: it reads as text until tapped,
// then becomes the input it always looked like. Saving happens on submit or on
// blur, because on a phone "done" and "tapped elsewhere" both mean finished.
//
// `status` is the small tag the frame floats above the email row (Verified /
// Unverified); the other rows pass nothing and it collapses.
function ProfileField({
  label,
  value,
  onSave,
  status,
  keyboardType,
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onSave?: (next: string) => Promise<string | null>;
  status?: { text: string; tone: 'ok' | 'warn' };
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  const styles = useThemedStyles(makeStyles);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = !!onSave;

  async function commit() {
    if (!onSave) return;
    const next = draft.trim();
    setEditing(false);
    // Nothing typed, or typed back to where it started: no round trip.
    if (!next || next === value) {
      setDraft(value);
      setError(null);
      return;
    }
    setSaving(true);
    const message = await onSave(next);
    setSaving(false);
    setError(message);
    // A rejected value must not linger in the box pretending it was accepted.
    if (message) setDraft(value);
  }

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeadRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {status ? (
          <Text
            style={[styles.fieldStatus, status.tone === 'ok' ? styles.statusOk : styles.statusWarn]}
          >
            {status.text}
          </Text>
        ) : null}
      </View>
      <Pressable
        style={styles.fieldBox}
        onPress={editable ? () => setEditing(true) : undefined}
        disabled={!editable || saving}
        accessibilityRole={editable ? 'button' : undefined}
        accessibilityLabel={editable ? `${label}: ${value}. Tap to edit.` : undefined}
      >
        {editing ? (
          <TextInput
            style={styles.fieldValue}
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            onSubmitEditing={commit}
            autoFocus
            returnKeyType="done"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            accessibilityLabel={label}
          />
        ) : (
          <Text style={styles.fieldValue} numberOfLines={1}>
            {saving ? 'Saving…' : value || '—'}
          </Text>
        )}
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { displayName, save: saveDisplayName } = useDisplayName();
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();
  const [openSection, setOpenSection] = useState<'profile' | 'appearance' | null>(null);
  // Two-step confirm (RN Alert is a no-op on web, so an inline confirm state
  // works everywhere)
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 'sent' is a confirmation the reader can see; it resets when a new address
  // is requested, so the button never claims to have sent the current one.
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

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

  // Signed out (frame 2130:3264): the same option rows with Profile disabled,
  // over a Sign In button at y608 and the create-account line at y673. The old
  // illustration-and-blurb gate is gone.
  if (!session) {
    return (
      <View style={styles.screenBg}>
        <ScreenBackground />
        <View style={styles.gateRows}>
          <AccountOption label="Profile" Icon={IconUser} disabled showChevron />
          <AccountOption
            label="Appearance"
            Icon={IconColorSwatch}
            expandable
            expanded={openSection === 'appearance'}
            onPress={() => setOpenSection((o) => (o === 'appearance' ? null : 'appearance'))}
          >
            <AppearanceModes />
          </AccountOption>
        </View>

        <View style={styles.gateGroup}>
          <AccountOption
            label="About Polari"
            Icon={IconBinoculars}
            showChevron
            onPress={() => router.push('/profile/about')}
          />
          {/* Same rows as the signed-in screen, in the same order and with the
              same disabled states: none of them need an account, and the
              Signed Out frame draws all seven. Only Profile is gated. */}
          <AccountOption label="App Info" Icon={IconInfoCircle} disabled />
          <AccountOption
            label="Feedback"
            Icon={IconMail}
            onPress={() => router.push('/profile/feedback')}
          />
        </View>

        <View style={styles.gateGroup}>
          <AccountOption
            label="Privacy Policy"
            Icon={IconShield}
            onPress={() => router.push('/profile/privacy')}
          />
          <AccountOption label="Terms and Conditions" Icon={IconFileText} disabled />
        </View>

        <Pressable
          style={({ pressed }) => [styles.gateSignIn, pressed && styles.pressed]}
          onPress={() => router.push('/profile/sign-in')}
          accessibilityRole="button"
        >
          <Text style={styles.gateSignInText}>Sign In</Text>
        </Pressable>
        <Text style={styles.gateCreate}>
          Don’t have an account yet?{' '}
          <Text
            style={styles.gateCreateAccent}
            onPress={() => router.push('/profile/create-account')}
          >
            Create one.
          </Text>
        </Text>
      </View>
    );
  }

  // Falls back to the local part of the address only until a name is set —
  // the onboarding gate asks for one, so this is the gap before it is answered.
  const greeting = displayName ?? session.user.email?.split('@')[0] ?? '';

  // Supabase keeps a requested address in `new_email` and leaves `email` on the
  // confirmed one until the link is clicked. The frame shows the NEW address
  // straight away, tagged Unverified — so read the pending value first and let
  // the tag carry the caveat, rather than hiding the change until it lands.
  const pendingEmail = (session.user as { new_email?: string }).new_email ?? null;
  const shownEmail = pendingEmail ?? session.user.email ?? '';

  async function saveEmail(next: string) {
    if (!/^\S+@\S+\.\S+$/.test(next)) return 'Enter a valid email address.';
    const { error } = await supabase.auth.updateUser({ email: next });
    if (error) {
      return error.message.toLowerCase().includes('already')
        ? 'That email is already in use.'
        : 'Could not update your email. Please try again.';
    }
    setResendState('idle');
    await supabase.auth.refreshSession();
    return null;
  }

  async function resendVerification() {
    if (!pendingEmail) return;
    setResendState('sending');
    const { error } = await supabase.auth.resend({ type: 'email_change', email: pendingEmail });
    setResendState(error ? 'idle' : 'sent');
  }

  return (
    <View style={styles.screenBg}>
      <ScreenBackground />
      {/* Account/Main puts the running version in the top-right corner, above
          the greeting. Read from the manifest rather than written out, so the
          release bump is the only place it lives. */}
      <Text style={styles.version} accessibilityLabel={`App version ${APP_VERSION}`}>
        Version {APP_VERSION}
      </Text>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
      >
        <Text style={styles.banner}>
          Bonyo, <Text style={styles.bannerName}>{greeting}</Text>
        </Text>

        <View style={styles.group}>
          <AccountOption
            label="Profile"
            Icon={IconUser}
            expandable
            expanded={openSection === 'profile'}
            onPress={() => setOpenSection((o) => (o === 'profile' ? null : 'profile'))}
          >
            <ProfileField
              label="DISPLAY NAME"
              value={displayName ?? ''}
              autoCapitalize="words"
              onSave={saveDisplayName}
            />
            <ProfileField
              label="EMAIL"
              value={shownEmail}
              keyboardType="email-address"
              status={
                pendingEmail
                  ? { text: 'Unverified', tone: 'warn' }
                  : { text: 'Verified', tone: 'ok' }
              }
              onSave={saveEmail}
            />
            <View style={styles.profileButtons}>
              <Pressable
                style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
                onPress={() => router.push('/profile/change-password')}
                accessibilityRole="button"
              >
                <Text style={styles.profileButtonText}>Change Password</Text>
              </Pressable>
              {/* Only offered while a change is actually outstanding — there is
                  nothing to resend once the address is confirmed. */}
              {pendingEmail ? (
                <Pressable
                  style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
                  onPress={resendVerification}
                  accessibilityRole="button"
                >
                  <Text style={styles.profileButtonText}>
                    {resendState === 'sending'
                      ? 'Sending…'
                      : resendState === 'sent'
                        ? 'Email Sent'
                        : 'Resend Verification Email'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </AccountOption>

          <AccountOption
            label="Appearance"
            Icon={IconColorSwatch}
            expandable
            expanded={openSection === 'appearance'}
            onPress={() => setOpenSection((o) => (o === 'appearance' ? null : 'appearance'))}
          >
            <AppearanceModes />
          </AccountOption>
        </View>

        <View style={styles.group}>
          <AccountOption
            label="About Polari"
            Icon={IconBinoculars}
            onPress={() => router.push('/profile/about')}
          />
          {/* App Info, Privacy Policy and Terms are drawn in the frames but have
              nothing behind them yet, so they render disabled rather than
              leading somewhere empty. Give each an onPress to switch it on. */}
          <AccountOption label="App Info" Icon={IconInfoCircle} disabled />
          <AccountOption
            label="Feedback"
            Icon={IconMail}
            onPress={() => router.push('/profile/feedback')}
          />
        </View>

        <View style={styles.group}>
          <AccountOption
            label="Privacy Policy"
            Icon={IconShield}
            onPress={() => router.push('/profile/privacy')}
          />
          {/* Terms has no screen behind it yet, so it stays disabled. */}
          <AccountOption label="Terms and Conditions" Icon={IconFileText} disabled />
        </View>

        {/* The frame parts the sign-out row further from the block above it
            than the blocks are from each other — 38 rather than 24. */}
        <View style={styles.signOutGroup}>
          <AccountOption label="Sign Out" Icon={IconLogout} onPress={signOut} />
          <Pressable onPress={() => setConfirmingDelete(true)} disabled={deleting}>
            <Text style={styles.deleteAccount}>{deleting ? 'Deleting…' : 'Delete Account'}</Text>
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
                style={({ pressed }) => [
                  styles.confirmButton,
                  styles.keepButton,
                  pressed && styles.pressed,
                ]}
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
                style={({ pressed }) => [
                  styles.confirmButton,
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
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

// Falls back rather than throwing: a missing manifest should cost the corner
// label, not the whole Account screen.
const APP_VERSION = Constants.expoConfig?.version ?? '—';

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // Wrapper so the sparkle pattern stays fixed behind the scrolling content.
    screenBg: { flex: 1 },
    // Frame puts the ink at x307..366, y25..31 — right-aligned 27 in from the
    // edge, above everything the screen scrolls.
    version: {
      position: 'absolute',
      right: 27,
      top: 22,
      fontFamily: fonts.bold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: '#919BAB',
      zIndex: 1,
    },
    container: {
      flex: 1,
      // Transparent on purpose. This ScrollView sits directly over
      // <ScreenBackground />, so any opaque fill here hides the sparkle pattern
      // entirely — which is what it used to do, in the wrong grey as well
      // (#DCDFE4 `background` rather than the #E7E9EC `canvas` every other screen
      // uses). The canvas colour belongs to ScreenBackground; this just scrolls.
      backgroundColor: 'transparent',
    },
    // Account container x27 y187: three groups 60 apart, rows 8 apart.
    content: {
      paddingHorizontal: 27,
      paddingTop: 116,
      // paddingBottom comes from useTabBarInset at the call site: the floating
      // tab bar's height varies with the device's safe-area inset.
    },
    // Signed-out gate: rows from y150, Sign In at y608, prompt at y673.
    // The signed-out rows carry the same 8-within / 24-between rhythm as the
    // signed-in groups; only the first one is pushed down to the frame's y150.
    gateRows: { marginTop: 150, marginHorizontal: 27, gap: 8, marginBottom: 24 },
    gateGroup: { marginHorizontal: 27, gap: 8, marginBottom: 24 },
    gateSignIn: {
      position: 'absolute',
      left: 98,
      top: 608,
      width: 199,
      height: 50,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gateSignInText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      letterSpacing: 0.3,
      color: colors.onPrimary,
    },
    gateCreate: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 673,
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
    },
    gateCreateAccent: { color: colors.primary },
    banner: {
      marginLeft: 10,
      // Puts the first row's top on y150, where the frame draws it.
      marginBottom: 10,
      fontFamily: fonts.bold,
      fontSize: 20,
      letterSpacing: 0.3,
      color: colors.text,
    },
    bannerName: { color: colors.primary },
    // Measured off Account/Main/Signed In.png: rows 50 tall sit 8 apart inside a
    // block and 24 apart between blocks. It was a uniform 60.
    group: { gap: 8, marginBottom: 24 },
    signOutGroup: { gap: 8, marginBottom: 24, marginTop: 14 },

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
    // The label and the Verified/Unverified tag share a line, pushed apart.
    fieldHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fieldStatus: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.3 },
    statusOk: { color: colors.green },
    statusWarn: { color: HEART_RED },
    fieldError: { marginLeft: 10, fontFamily: fonts.semibold, fontSize: 9, color: HEART_RED },
    // Change Password sits beside Resend Verification Email when an address is
    // outstanding, so they are bordered pills on a wrapping row rather than the
    // single underlined link this used to be.
    profileButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    profileButton: {
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.metaText,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    profileButtonText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: colors.text,
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
    // Selected is the solid blue chip the frame draws on Light Mode; the other
    // two are the bordered surface chips beside it.
    modeActive: { backgroundColor: colors.primary },
    modeIdle: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.fieldBorder,
    },
    modeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.3, color: colors.onPrimary },
    modeTextIdle: { color: colors.text },

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
