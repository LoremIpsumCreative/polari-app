import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { FormError, FormScreen, LabeledInput, PrimaryButton } from '../../src/components/form';
import { colors, spacing } from '../../src/lib/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSignUp() {
    setError(null);
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      router.replace('/');
    } else {
      // Email confirmation is enabled on the project, so no session yet
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <FormScreen title="Check your email">
        <Text style={styles.confirmText}>
          We've sent a confirmation link to {email.trim()}. Tap it, then come back and sign
          in.
        </Text>
        <Link href="/sign-in" asChild>
          <Pressable>
            <Text style={styles.link}>
              <Text style={styles.linkStrong}>Back to sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </FormScreen>
    );
  }

  return (
    <FormScreen title="Join the scene">
      <LabeledInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <LabeledInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 6 characters"
      />
      <FormError message={error} />
      <PrimaryButton
        title="Create account"
        onPress={handleSignUp}
        loading={loading}
        disabled={!email.trim() || password.length < 6}
      />
      <View style={styles.links}>
        <Link href="/sign-in" asChild>
          <Pressable>
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkStrong}>Sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  link: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  linkStrong: {
    color: colors.primary,
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
