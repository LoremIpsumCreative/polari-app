import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      {/* Account/Main runs its welcome banner from y116 with no header. */}
      <Stack.Screen name="index" options={{ title: 'Account', headerShown: false }} />
      <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
      <Stack.Screen name="about" options={{ title: 'About Polari' }} />
    </Stack>
  );
}
