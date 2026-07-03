import { Stack } from 'expo-router';

export default function DictionaryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dictionary' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Word' }} />
    </Stack>
  );
}
