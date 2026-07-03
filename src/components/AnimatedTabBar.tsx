import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import {
  IconBook2,
  IconHeart,
  IconSparkles,
  IconTargetArrow,
  IconUser,
  type IconProps,
} from '@tabler/icons-react-native';
import { colors, spacing } from '../lib/theme';

const BUBBLE_SIZE = 56;
// How far the bubble (and active icon) float above the bar's top edge
const BUBBLE_LIFT = BUBBLE_SIZE / 2;
// The ring around the bubble, painted in the screens' background colour so the
// bubble reads as "cut out" of the bar, like the reference animation
const BUBBLE_RING = 6;
const ICON_SIZE = 26;
const BAR_CONTENT_HEIGHT = 62;

const TAB_ICONS: Record<string, React.ComponentType<IconProps>> = {
  index: IconSparkles,
  dictionary: IconBook2,
  quiz: IconTargetArrow,
  favourites: IconHeart,
  profile: IconUser,
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
  const Icon = TAB_ICONS[routeName.replace(/\/index$/, '')] ?? IconSparkles;

  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityLabel={label}>
      <Animated.View
        style={{
          transform: [
            {
              translateY: lift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -(BUBBLE_LIFT + spacing.sm)],
              }),
            },
            {
              scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
            },
          ],
        }}
      >
        <Icon size={ICON_SIZE} color={active ? colors.primary : colors.textMuted} />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabCount = state.routes.length;
  const tabWidth = tabCount > 0 ? barWidth / tabCount : 0;

  const bubbleX = useRef(new Animated.Value(0)).current;

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
      style={[styles.bar, { paddingBottom: insets.bottom, height: BAR_CONTENT_HEIGHT + insets.bottom }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          style={[styles.bubble, { transform: [{ translateX: bubbleX }] }]}
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
            if (!active && !event.defaultPrevented) {
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    height: BAR_CONTENT_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
  },
  bubble: {
    position: 'absolute',
    top: -(BUBBLE_LIFT + BUBBLE_RING),
    left: 0,
    width: BUBBLE_SIZE + BUBBLE_RING * 2,
    height: BUBBLE_SIZE + BUBBLE_RING * 2,
    borderRadius: (BUBBLE_SIZE + BUBBLE_RING * 2) / 2,
    backgroundColor: colors.surface,
    borderWidth: BUBBLE_RING,
    borderColor: colors.background,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    pointerEvents: 'none',
  },
});
