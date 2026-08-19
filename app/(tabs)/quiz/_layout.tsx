import { Stack } from 'expo-router';
import { useHeaderOptions } from '../../../src/lib/appearance';

export default function QuizLayout() {
  const headerOptions = useHeaderOptions();
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Quiz', headerShown: false }} />
      <Stack.Screen name="play" options={{ title: 'Quiz', headerShown: false }} />
      <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
    </Stack>
  );
}
