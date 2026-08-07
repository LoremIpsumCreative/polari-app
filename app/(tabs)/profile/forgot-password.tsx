import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { supabase } from '../../../src/lib/supabase';
import { colors, spacing } from '../../../src/lib/theme';
import { ScreenBackground } from '../../../src/components/ScreenBackground';
import { useTabBarInset } from '../../../src/components/AnimatedTabBar';
import {
  BackChip,
  FieldsetInput,
  FormCard,
  FormError,
  FormNotice,
  PillButton,
  ScreenTitle,
} from '../../../src/components/form';

// Account/Forgot Password. Same skeleton as Change Password, but the card
// holds a single EMAIL field and closes at y272; the Send Reset Link CTA
// still sits at y659, so the gap between them is deliberate whitespace
// rather than anything the card grows into.

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  async function handleSend() {
    setError(null);
    // Solid CTA over an empty form, as the frame draws it.
    if (!email.trim()) {
      setError('Enter the email address on your account.');
      return;
    }
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <BackChip />
        <ScreenTitle>Forgot Password</ScreenTitle>

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
        </FormCard>

        <FormError message={error} />
        <FormNotice
          message={
            sent ? `If an account exists for ${email.trim()}, a reset link is on its way.` : null
          }
        />

        <PillButton
          title="Send Reset Link"
          onPress={handleSend}
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

  // Card bottom y272 → CTA top y659.
  cta: { marginTop: 386 },
});
