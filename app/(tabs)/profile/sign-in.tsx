import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { colors, fonts, spacing } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';
import {
  BackChip,
  FieldsetInput,
  FormCard,
  FormError,
  PillButton,
  ScreenTitle,
} from '../../../src/components/form';

// Sign In has no frame of its own — the Account section's signed-out state
// (2130:3264) carries the entry point and the redesign never drew the screen
// behind it. Built on the same kit as its siblings so the flow doesn't drop
// out of the design language halfway through, with the Change Password card's
// FORGOT PASSWORD? link in the same position.

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  async function handleSignIn() {
    setError(null);
    // Solid CTA over an empty form, as the sibling frames draw it — the
    // required-field check lives here rather than in a dimmed button.
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/profile');
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <BackChip />
        <ScreenTitle>Sign In</ScreenTitle>

        <FormCard>
          <FieldsetInput
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
          />
          <View style={styles.gap} />
          <FieldsetInput
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
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
        </FormCard>

        <FormError message={error} />

        <PillButton
          title="Sign In"
          onPress={handleSignIn}
          loading={busy}
          style={styles.cta}
        />

        <Text style={styles.createLine}>
          Don&apos;t have an account yet?{' '}
          <Text
            style={styles.createAccent}
            onPress={() => router.replace('/profile/create-account')}
          >
            Create one.
          </Text>
        </Text>
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

  forgotWrap: { alignSelf: 'flex-end', marginTop: 8 },
  forgot: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
    textDecorationLine: 'underline',
  },

  // Card closes at y351 (22 + 45 + 12 + 45 + the forgot link + 18) → CTA top
  // y659, the same line Create Account, Forgot Password and Change Password
  // put it on. The generated Sign In frame (2666:2894) instead places its
  // button at y608 w199 — the signed-out gate's geometry, not this flow's —
  // so the frame is the odd one out and wants correcting, not the code.
  cta: { marginTop: 308 },

  // Mirrors the signed-out Account screen's own create-account line at y673.
  createLine: {
    marginTop: 14,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.textMuted,
    textAlign: 'center',
  },
  createAccent: { color: colors.primary },
});
