import { Stack } from 'expo-router';
import { useHeaderOptions } from '../../../src/lib/appearance';

export default function DictionaryLayout() {
  const headerOptions = useHeaderOptions();
  return (
    <Stack screenOptions={headerOptions}>
      {/* The Figma frame draws its own centred "Polari Dictionary" title. */}
      <Stack.Screen name="index" options={{ title: 'Dictionary', headerShown: false }} />
      {/* Definition (1885:2061) has no header in the frame — the art runs to
          the top of the screen. Back is the system gesture / browser back. */}
      <Stack.Screen name="[slug]" options={{ title: 'Word', headerShown: false }} />
      {/* Curated List draws its own back chip, so the native header stays off. */}
      <Stack.Screen
        name="collection/[slug]"
        options={{ title: 'Collection', headerShown: false }}
      />
    </Stack>
  );
}
