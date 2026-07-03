import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Dictionary', headerShown: false }} />
      <Tabs.Screen name="quiz" options={{ title: 'Quiz', headerShown: false }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
    </Tabs>
  );
}
