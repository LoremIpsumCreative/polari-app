import { Stack } from 'expo-router';
import { useHeaderOptions } from '../../../src/lib/appearance';

export default function ProfileLayout() {
  const headerOptions = useHeaderOptions();
  return (
    <Stack screenOptions={headerOptions}>
      {/* Account/Main runs its welcome banner from y116 with no header. */}
      <Stack.Screen name="index" options={{ title: 'Account', headerShown: false }} />
      <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
      {/* About draws its own back chip and title beside the Auntie art. */}
      <Stack.Screen name="about" options={{ title: 'About Polari', headerShown: false }} />
      {/* Change Password likewise draws its own chip and title. */}
      <Stack.Screen
        name="change-password"
        options={{ title: 'Change Password', headerShown: false }}
      />
      {/* Privacy Policy draws its own chip and title too. The slug is "privacy"
          rather than "privacy-policy", per the change request. */}
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy', headerShown: false }} />
      {/* The account-entry frames (2444:2697, 2444:2758) show the tab bar and
          an "Account" back chip, so they belong to this stack rather than the
          (auth) group — which renders outside the tabs and has no bar. */}
      <Stack.Screen name="sign-in" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen
        name="create-account"
        options={{ title: 'Create Account', headerShown: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ title: 'Forgot Password', headerShown: false }}
      />
    </Stack>
  );
}
