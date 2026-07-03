import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { FormError, FormScreen, LabeledInput, PrimaryButton } from '../../src/components/form';
import { colors, fonts } from '../../src/lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <FormScreen title="Check your email">
        <Text style={styles.confirmText}>
          If an account exists for {email.trim()}, a password reset link is on its way.
        </Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen title="Reset your password">
      <LabeledInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <FormError message={error} />
      <PrimaryButton
        title="Send reset link"
        onPress={handleReset}
        loading={loading}
        disabled={!email.trim()}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  confirmText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
