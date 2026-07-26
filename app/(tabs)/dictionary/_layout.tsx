import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function DictionaryLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      {/* The Figma frame draws its own centred "Polari Dictionary" title. */}
      <Stack.Screen name="index" options={{ title: 'Dictionary', headerShown: false }} />
      <Stack.Screen name="[slug]" options={{ title: 'Word' }} />
      <Stack.Screen name="collection/[slug]" options={{ title: 'Collection' }} />
    </Stack>
  );
}
