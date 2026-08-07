import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  OutlinePillButton,
  PasswordRules,
  PillButton,
  ScreenTitle,
  meetsPasswordRules,
} from '../../../src/components/form';

// Account/Create Account (Figma 2444:2697) and its success state
// (2444:2758). Fields run FIRST NAME, LAST NAME, then a 29px group break
// before EMAIL, NEW PASSWORD and REENTER NEW PASSWORD at 13px apart; the
// card ends with the password checklist and the CTA sits at y659.
//
// Both frames carry the tab bar and a chip reading "Account", which is why
// this lives in the profile stack rather than the (auth) group — the group
// renders outside the tabs and could not show either.

export default function CreateAccountScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reenter, setReenter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  // The bar floats over the screen, so the scroll has to end above it by hand.
  const tabInset = useTabBarInset();

  async function handleCreate() {
    setError(null);
    // The frame draws the CTA at full strength over an empty form, so it is
    // never dimmed out — the required-field check happens here instead, where
    // it can say what is actually missing.
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !reenter) {
      setError('Please fill in every field.');
      return;
    }
    if (!meetsPasswordRules(password)) {
      setError('Your password does not meet the requirements below.');
      return;
    }
    if (password !== reenter) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Surfaced back as user_metadata, which is what the Account screen
      // greets people by.
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
      },
    });
    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      // Email confirmation is off on the project — straight in.
      router.replace('/profile');
      return;
    }
    setCreated(true);
  }

  if (created) {
    return (
      <View style={styles.screen}>
        <ScreenBackground />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
        >
          <BackChip />
          <ScreenTitle>Create Account</ScreenTitle>

          <FormCard style={styles.successCard}>
            <Text style={styles.successHeading}>Your account has been created</Text>
            <Text style={styles.successBody}>
              We&apos;ve sent a confirmation link to {email.trim()}. Tap it, then come back and sign
              in.
            </Text>
            <OutlinePillButton
              title="Open Email"
              onPress={() => {
                // Best-effort hand-off to the device's mail client; on web the
                // scheme is a no-op, so the copy above still carries the step.
                Linking.openURL('message://').catch(() => {
                  Linking.openURL('mailto:').catch(() => {});
                });
              }}
            />
          </FormCard>

          <PillButton
            title="Back to Sign In"
            onPress={() => router.replace('/profile/sign-in')}
            style={styles.successCta}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <BackChip />
        <ScreenTitle>Create Account</ScreenTitle>

        <FormCard>
          <FieldsetInput
            label="FIRST NAME"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
          />
          <View style={styles.gap} />
          <FieldsetInput
            label="LAST NAME"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="family-name"
          />

          {/* The frame breaks the name pair off from the credentials with a
              29px gap rather than the 13px it uses between siblings. */}
          <View style={styles.groupGap} />
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
          title="Create Account"
          onPress={handleCreate}
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

  // Field siblings sit 13 apart, the name/credentials break 29.
  gap: { height: 12 },
  groupGap: { height: 28 },

  // Card bottom y583 → CTA top y659.
  cta: { marginTop: 75 },

  // Success card y186..376: padding, heading, body, then Open Email at y307.
  // The frame sets the body against a literal "{email}" token, so a long real
  // address can wrap to a fourth line and grow the card — the CTA below then
  // travels with it rather than overlapping.
  successCard: { paddingTop: 18, paddingBottom: 18, alignItems: 'center' },
  // Card bottom y376 → CTA top y659.
  successCta: { marginTop: 283 },
  successHeading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  successBody: {
    marginTop: 12,
    marginBottom: 34,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 18,
    color: colors.text,
    textAlign: 'center',
  },
});
