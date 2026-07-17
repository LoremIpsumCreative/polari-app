import { Stack } from 'expo-router';
import { headerOptions } from '../../../src/lib/theme';

export default function CollectionLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Collections' }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
      <Stack.Screen name="gallery" options={{ title: 'Gallery' }} />
    </Stack>
  );
}
