import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import {
  IconBook2,
  IconLayoutDashboard,
  IconSparkles,
  IconTargetArrow,
  IconUserCircle,
  type IconProps,
} from '@tabler/icons-react-native';
import { colors, fonts, tabAccents } from '../lib/theme';
import { useStageDark } from '../lib/stageDark';

// Geometry taken from the Figma "Navbar" component (node 1096:217): the
// selection bubble is a 75px circle with a 9px OUTSIDE ring, and the bar is
// 101px tall with 24px icons.
const BUBBLE_SIZE = 75;
// The ring around the bubble, painted in the screens' background colour so the
// bubble reads as "cut out" of the bar, like the reference animation
const BUBBLE_RING = 9;
const ICON_SIZE = 24;
const LABEL_HEIGHT = 16;
const ICON_LABEL_GAP = 4;
// The icon+label column is centred in this full height.
const BAR_CONTENT_HEIGHT = 101;

// Where the icon's centre rests inside the bar (column is vertically centred)
const ICON_REST_CENTER =
  (BAR_CONTENT_HEIGHT - (ICON_SIZE + ICON_LABEL_GAP + LABEL_HEIGHT)) / 2 + ICON_SIZE / 2;
// The bubble's centre sits exactly on the bar's top edge (y = 0), so lifting
// the icon by its resting depth lands it dead-centre in the bubble.
const ICON_LIFT = ICON_REST_CENTER;

// The bubble's top half overhangs the bar into the screen above it. Screens must
// keep this much clear at the bottom or their content collides with the
// selection circle. TAB_CONTENT_CLEARANCE adds the 20px breathing gap the Figma
// screens leave above the circle (Continue ends y=700, circle top y=720).
export const TAB_BUBBLE_OVERHANG = BUBBLE_SIZE / 2 + BUBBLE_RING;
export const TAB_CONTENT_CLEARANCE = TAB_BUBBLE_OVERHANG + 20;

const TAB_ICONS: Record<string, React.ComponentType<IconProps>> = {
  index: IconSparkles,
  dictionary: IconBook2,
  quiz: IconTargetArrow,
  favourites: IconLayoutDashboard,
  profile: IconUserCircle,
};

// RN-web only supports the JS animation driver
const useNative = Platform.OS !== 'web';

function TabItem({
  label,
  routeName,
  active,
  onPress,
}: {
  label: string;
  routeName: string;
  active: boolean;
  onPress: () => void;
}) {
  const lift = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: active ? 1 : 0,
      useNativeDriver: useNative,
      friction: 7,
      tension: 60,
    }).start();
  }, [active, lift]);

  // Routes without a nested _layout are registered as "name/index"
  const base = routeName.replace(/\/index$/, '');
  const Icon = TAB_ICONS[base] ?? IconSparkles;
  // Every tab lights up in its own colour when active (per the Figma Navbar).
  const accent = tabAccents[base] ?? colors.primary;

  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityLabel={label}>
      <Animated.View
        style={{
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -ICON_LIFT],
              }),
            },
            {
              scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
            },
          ],
        }}
      >
        <Icon size={ICON_SIZE} color={active ? accent : colors.textMuted} />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive, active && { color: accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Tabs always navigate directly: the screens own their submenus now (the quiz
// landing's permanent mode fan, the Collections hub's satellite buttons), so
// the bar no longer opens a satellite fan of its own.
export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabCount = state.routes.length;
  const tabWidth = tabCount > 0 ? barWidth / tabCount : 0;

  const bubbleX = useRef(new Animated.Value(0)).current;

  // The bubble's cut-out ring must match whatever backdrop sits behind it.
  // Dark quiz stages declare themselves via setStageDark — by the bottom of a
  // dark stage the gradient has washed to solid stageDeep, so the ring uses
  // that rather than the stage's lighter base colour.
  const stageDark = useStageDark();
  const ringColor = stageDark ? colors.stageDeep : colors.background;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(bubbleX, {
      toValue: state.index * tabWidth + tabWidth / 2 - (BUBBLE_SIZE + BUBBLE_RING * 2) / 2,
      useNativeDriver: useNative,
      friction: 7,
      tension: 60,
    }).start();
  }, [state.index, tabWidth, bubbleX]);

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          style={[
            styles.bubble,
            { borderColor: ringColor, transform: [{ translateX: bubbleX }] },
          ]}
        />
      ) : null}

      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const active = state.index === index;

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;
            if (!active) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <TabItem
              key={route.key}
              label={label}
              routeName={route.name}
              active={active}
              onPress={handlePress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
  },
  tabs: {
    flexDirection: 'row',
    height: BAR_CONTENT_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ICON_LABEL_GAP,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    height: LABEL_HEIGHT,
    lineHeight: LABEL_HEIGHT,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
  },
  bubble: {
    position: 'absolute',
    top: -(BUBBLE_SIZE / 2 + BUBBLE_RING),
    left: 0,
    width: BUBBLE_SIZE + BUBBLE_RING * 2,
    height: BUBBLE_SIZE + BUBBLE_RING * 2,
    borderRadius: (BUBBLE_SIZE + BUBBLE_RING * 2) / 2,
    backgroundColor: colors.surface,
    borderWidth: BUBBLE_RING,
    pointerEvents: 'none',
  },
});
