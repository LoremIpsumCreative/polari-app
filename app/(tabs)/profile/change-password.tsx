import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { colors, radii, fonts, spacing } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';

// Account/Change Password (Figma 2149:3060): back chip y52, title y90, the
// form card at y187, and the Confirm button at y659.

const RULES: { label: string; ok: (pw: string) => boolean }[] = [
  { label: 'At least 8 characters', ok: (pw) => pw.length >= 8 },
  { label: 'At least 1 lowercase letter', ok: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 uppercase letter', ok: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 number or symbol', ok: (pw) => /[^A-Za-z]/.test(pw) },
];

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [reenter, setReenter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  const meetsRules = RULES.every((r) => r.ok(next));

  async function handleConfirm() {
    setError(null);
    if (!meetsRules) {
      setError('Your new password does not meet the requirements below.');
      return;
    }
    if (next !== reenter) {
      setError('The two new passwords do not match.');
      return;
    }
    const email = session?.user.email;
    if (!email) {
      setError('You need to be signed in to change your password.');
      return;
    }

    setBusy(true);
    // Supabase lets a signed-in user set a new password without proving the
    // old one, so the current password is checked first — otherwise anyone
    // with an unlocked device could change it.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (reauthError) {
      setBusy(false);
      setError('That current password is not right.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (updateError) {
      setError('Could not change your password. Please try again.');
      return;
    }
    setDone(true);
    setCurrent('');
    setNext('');
    setReenter('');
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Account"
        >
          <IconChevronLeft size={10} color={colors.text} />
          <Text style={styles.backChipText}>Account</Text>
        </Pressable>

        <Text style={styles.title}>Change Password</Text>

        <View style={styles.card}>
          <PasswordField label="CURRENT PASSWORD" value={current} onChangeText={setCurrent} />
          <Pressable
            onPress={() => router.push('/forgot-password')}
            accessibilityRole="button"
            style={styles.forgotWrap}
          >
            <Text style={styles.forgot}>FORGOT PASSWORD?</Text>
          </Pressable>

          <PasswordField label="NEW PASSWORD" value={next} onChangeText={setNext} />
          <PasswordField label="REENTER NEW PASSWORD" value={reenter} onChangeText={setReenter} />

          <View style={styles.rules}>
            <Text style={styles.rulesTitle}>Your password must include:</Text>
            {RULES.map((r) => (
              <Text
                key={r.label}
                style={[styles.rule, next.length > 0 && r.ok(next) && styles.ruleMet]}
              >
                · {r.label}
              </Text>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {done ? <Text style={styles.done}>Password changed.</Text> : null}

        <Pressable
          onPress={handleConfirm}
          disabled={busy}
          style={({ pressed }) => [styles.confirm, (pressed || busy) && styles.pressed]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  // paddingBottom comes from useTabBarInset at the call site: the floating tab
  // bar's height varies with the device's safe-area inset.
  content: {},

  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 52,
    marginLeft: 17,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.inset,
  },
  backChipText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.3, color: colors.text },
  pressed: { opacity: 0.7 },

  title: {
    marginTop: 7,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
  },

  // Form card x27 y187 w340, fields inset 14.
  card: {
    marginTop: 57,
    marginHorizontal: 27,
    paddingHorizontal: 14,
    paddingVertical: 18,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.fieldBorder,
  },
  field: { gap: 6 },
  fieldLabel: {
    marginLeft: 10,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  input: {
    height: 49,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
    paddingHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.text,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 22 },
  forgot: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
    textDecorationLine: 'underline',
  },

  rules: { marginTop: 20, gap: 4 },
  rulesTitle: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.3, color: colors.textFaint },
  rule: {
    marginLeft: 12,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  ruleMet: { color: colors.correct },

  error: {
    marginTop: 18,
    marginHorizontal: 27,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  done: {
    marginTop: 18,
    marginHorizontal: 27,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.correct,
    textAlign: 'center',
  },

  // Confirm button x76 y659 w243 h50.
  confirm: {
    alignSelf: 'center',
    marginTop: 60,
    width: 243,
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.3, color: colors.onPrimary },
});
