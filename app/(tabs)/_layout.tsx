import { Tabs } from 'expo-router';
import { headerOptions } from '../../src/lib/theme';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: true, ...headerOptions }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Dictionary', headerShown: false }} />
      <Tabs.Screen name="quiz" options={{ title: 'Quiz', headerShown: false }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
    </Tabs>
  );
}
