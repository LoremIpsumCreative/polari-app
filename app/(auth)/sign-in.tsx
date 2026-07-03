import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { FormError, FormScreen, LabeledInput, PrimaryButton } from '../../src/components/form';
import { colors, spacing } from '../../src/lib/theme';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      router.replace('/');
    }
  }

  return (
    <FormScreen title="Bona to vada you!">
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
        autoComplete="current-password"
        placeholder="••••••••"
      />
      <FormError message={error} />
      <PrimaryButton
        title="Sign in"
        onPress={handleSignIn}
        loading={loading}
        disabled={!email.trim() || !password}
      />
      <View style={styles.links}>
        <Link href="/forgot-password" asChild>
          <Pressable>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </Link>
        <Link href="/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>
              New here? <Text style={styles.linkStrong}>Create an account</Text>
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
  },
  linkStrong: {
    color: colors.primary,
    fontWeight: '600',
  },
});
