import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { colors, fonts } from '../../src/lib/theme';
import { ScreenBackground } from '../../src/components/ScreenBackground';
import {
  FieldsetInput,
  FormCard,
  FormError,
  PasswordRules,
  PillButton,
  ScreenTitle,
  meetsPasswordRules,
} from '../../src/components/form';

// Landing screen for the password-recovery email link. The link signs the user
// in with a temporary recovery session (picked up from the URL on web), after
// which updateUser sets the new password.
//
// The only Account screen that stays outside the tabs: it is reached cold from
// an email, so it carries no back chip — there is nothing behind it to go back
// to — and the (auth) stack draws a plain header instead. Everything below the
// header is the same kit as its siblings.

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [reenter, setReenter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpdate() {
    setError(null);
    if (!meetsPasswordRules(password)) {
      setError('Your new password does not meet the requirements below.');
      return;
    }
    if (password !== reenter) {
      setError('The two new passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace('/profile');
  }

  if (!session) {
    return (
      <View style={styles.screen}>
        <ScreenBackground />
        <ScreenTitle>Link Expired</ScreenTitle>
        <FormCard>
          <Text style={styles.body}>
            This reset link is invalid or has expired. Request a new one from the Account
            screen.
          </Text>
        </FormCard>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle>New Password</ScreenTitle>

        <FormCard>
          <FieldsetInput
            label="NEW PASSWORD"
            value={password}
            onChangeText={setPassword}
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
          <PasswordRules value={password} />
        </FormCard>

        <FormError message={error} />

        <PillButton
          title="Update Password"
          onPress={handleUpdate}
          loading={busy}
          style={styles.cta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: 40 },
  gap: { height: 12 },
  cta: { marginTop: 60 },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
});
