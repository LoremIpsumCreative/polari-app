import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function ProfileLayout() {
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
