import { Stack } from 'expo-router';
import { WordsProvider } from '../src/lib/words';

export default function RootLayout() {
  return (
    <WordsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </WordsProvider>
  );
}
