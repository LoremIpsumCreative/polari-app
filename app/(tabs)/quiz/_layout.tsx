import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function QuizLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Quiz' }} />
      <Stack.Screen name="play" options={{ title: 'Quiz', headerBackVisible: false }} />
      <Stack.Screen name="results" options={{ title: 'Results', headerBackVisible: false }} />
    </Stack>
  );
}
