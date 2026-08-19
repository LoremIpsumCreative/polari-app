import { Stack } from 'expo-router';
import { useHeaderOptions } from '../../../src/lib/appearance';

// Every Collections screen draws its own chrome (back chip + title chip per
// the Figma mockups), so the native headers stay hidden.
export default function CollectionLayout() {
  const headerOptions = useHeaderOptions();
  return (
    <Stack screenOptions={{ ...headerOptions, headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Collections' }} />
      <Stack.Screen name="list" options={{ title: 'Favourites' }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
      <Stack.Screen name="gallery" options={{ title: 'Gallery' }} />
    </Stack>
  );
}
