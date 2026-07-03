import { Stack } from 'expo-router';
import { headerOptions } from '../../src/lib/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Choose a new password' }} />
    </Stack>
  );
}
