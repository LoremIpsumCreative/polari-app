import { Tabs } from 'expo-router';
import { headerOptions } from '../../src/lib/theme';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{ headerShown: true, ...headerOptions }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      {/* Tab order mirrors the Figma navbar: Collections · Dictionary · Today · Quiz · Account */}
      <Tabs.Screen name="favourites" options={{ title: 'Collections', headerShown: false }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Dictionary', headerShown: false }} />
      <Tabs.Screen name="index" options={{ title: 'Today', headerShown: false }} />
      <Tabs.Screen name="quiz" options={{ title: 'Quiz', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Account', headerShown: false }} />
    </Tabs>
  );
}
