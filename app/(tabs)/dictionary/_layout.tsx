import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function DictionaryLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Dictionary' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Word' }} />
    </Stack>
  );
}
