import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import { colors, fonts, spacing } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';
import {
  BackChip,
  FieldsetInput,
  FormCard,
  FormError,
  FormNotice,
  PasswordRules,
  PillButton,
  ScreenTitle,
  meetsPasswordRules,
} from '../../../src/components/form';

// Account/Change Password (Figma 2444:2636 — 2149:3060 is Forgot Password;
// the CSV had them swapped): card y186..519 with CURRENT
// PASSWORD at y209, the FORGOT PASSWORD? link at y264, then NEW PASSWORD
// y332 and REENTER NEW PASSWORD y389 before the checklist. Confirm at y659.

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

  async function handleConfirm() {
    setError(null);
    setDone(false);
    if (!meetsPasswordRules(next)) {
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
        keyboardShouldPersistTaps="handled"
      >
        <BackChip />
        <ScreenTitle>Change Password</ScreenTitle>

        <FormCard>
          <FieldsetInput
            label="CURRENT PASSWORD"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />
          <Pressable
            onPress={() => router.push('/profile/forgot-password')}
            accessibilityRole="button"
            style={styles.forgotWrap}
          >
            <Text style={styles.forgot}>FORGOT PASSWORD?</Text>
          </Pressable>

          <FieldsetInput
            label="NEW PASSWORD"
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <View style={styles.gap} />
          <FieldsetInput
            label="REENTER NEW PASSWORD"
            value={reenter}
            onChangeText={setReenter}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <PasswordRules value={next} />
        </FormCard>

        <FormError message={error} />
        <FormNotice message={done ? 'Password changed.' : null} />

        <PillButton
          title="Confirm"
          onPress={handleConfirm}
          loading={busy}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  // paddingBottom comes from useTabBarInset at the call site: the floating tab
  // bar's height varies with the device's safe-area inset.
  content: {},

  gap: { height: 12 },

  // Link y264..274, then a 55 break before NEW PASSWORD at y332 — the frame
  // treats the current-password row as its own group.
  forgotWrap: { alignSelf: 'flex-end', marginTop: 11, marginBottom: 54 },
  forgot: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.text,
    textDecorationLine: 'underline',
  },

  // Card bottom y519 → CTA top y659.
  cta: { marginTop: 139 },
});
