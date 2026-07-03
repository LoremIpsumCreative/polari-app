import { Stack } from 'expo-router';

export default function QuizLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Quiz' }} />
      <Stack.Screen name="play" options={{ title: 'Quiz', headerBackVisible: false }} />
      <Stack.Screen name="results" options={{ title: 'Results', headerBackVisible: false }} />
    </Stack>
  );
}
