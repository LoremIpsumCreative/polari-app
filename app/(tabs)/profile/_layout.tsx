import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Account' }} />
      <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
    </Stack>
  );
}
