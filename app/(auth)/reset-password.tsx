import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { FormError, FormScreen, LabeledInput, PrimaryButton } from '../../src/components/form';
import { colors, fonts } from '../../src/lib/theme';

// Landing screen for the password-recovery email link. The link signs the user
// in with a temporary recovery session (picked up from the URL on web), after
// which updateUser sets the new password.
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setError(null);
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      router.replace('/');
    }
  }

  if (!session) {
    return (
      <FormScreen title="Link expired">
        <Text style={styles.bodyText}>
          This reset link is invalid or has expired. Request a new one from the sign-in
          screen.
        </Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen title="Choose a new password">
      <LabeledInput
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 6 characters"
      />
      <FormError message={error} />
      <PrimaryButton
        title="Update password"
        onPress={handleUpdate}
        loading={loading}
        disabled={password.length < 6}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
