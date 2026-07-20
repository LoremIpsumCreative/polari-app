import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import Svg, { Path } from 'react-native-svg';
import {
  IconBook2,
  IconSparkles,
  IconTargetArrow,
  IconUserCircle,
  type IconProps,
} from '@tabler/icons-react-native';
import { colors, fonts, tabAccents } from '../lib/theme';
import { useStageDark } from '../lib/stageDark';

// Geometry taken from the Figma "Navbar" component (node 1096:217, readjusted):
// the selection bubble is a 55px circle with a 12px OUTSIDE ring, and the bar
// is 101px tall with 24px icons.
const BUBBLE_SIZE = 55;
const BUBBLE_RING = 12;
// The ring is a fixed light grey on light screens; dark quiz stages override it.
const RING_LIGHT = '#E7E9EC';
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

// The Collections glyph is bespoke (three rounded squares + a circle), drawn
// from the Figma icon's exact path — no Tabler icon matches it.
const COLLECTIONS_PATH =
  'M9.3105 12.8878 C9.99597 12.8878 10.5517 13.4206 10.5519 14.0774 L10.5519 21.8103 C10.5519 22.4674 9.99611 23 9.3105 23 L1.2414 23 C0.555794 23 0 22.4674 0 21.8103 L0 14.0774 C0.000218768 13.4206 0.555929 12.8878 1.2414 12.8878 L9.3105 12.8878 Z M21.5172 17.9439 C21.5171 17.2342 21.2237 16.5532 20.7001 16.0513 C20.1763 15.5493 19.4648 15.2671 18.724 15.2671 C17.9834 15.2672 17.2729 15.5494 16.7492 16.0513 C16.2255 16.5532 15.931 17.2341 15.9309 17.9439 C15.9309 18.6538 16.2254 19.3356 16.7492 19.8376 C17.2729 20.3394 17.9835 20.6205 18.724 20.6206 C19.4648 20.6206 20.1763 20.3396 20.7001 19.8376 C21.2239 19.3356 21.5172 18.6538 21.5172 17.9439 Z M2.4828 20.6206 L8.0691 20.6206 L8.0691 15.2671 L2.4828 15.2671 L2.4828 20.6206 Z M9.3105 0 C9.99611 0 10.5519 0.532636 10.5519 1.18968 L10.5519 8.92256 C10.5519 9.5796 9.99611 10.1122 9.3105 10.1122 L1.2414 10.1122 C0.555794 10.1122 0 9.5796 0 8.92256 L0 1.18968 C0 0.532636 0.555794 0 1.2414 0 L9.3105 0 Z M22.7586 0 C23.4442 0 24 0.532636 24 1.18968 L24 8.92256 C24 9.5796 23.4442 10.1122 22.7586 10.1122 L14.6895 10.1122 C14.0041 10.112 13.4481 9.57948 13.4481 8.92256 L13.4481 1.18968 C13.4481 0.532765 14.0041 0.000209652 14.6895 0 L22.7586 0 Z M15.9309 7.73289 L21.5172 7.73289 L21.5172 2.37935 L15.9309 2.37935 L15.9309 7.73289 Z M2.4828 7.73289 L8.0691 7.73289 L8.0691 2.37935 L2.4828 2.37935 L2.4828 7.73289 Z M24 17.9439 C24 19.2848 23.445 20.5717 22.4555 21.5199 C21.4661 22.4681 20.1233 23 18.724 23 C17.325 22.9999 15.9831 22.4679 14.9938 21.5199 C14.0044 20.5717 13.4481 19.2848 13.4481 17.9439 C13.4482 16.6031 14.0044 15.3172 14.9938 14.369 C15.9831 13.4209 17.3249 12.8879 18.724 12.8878 C20.1233 12.8878 21.4661 13.4208 22.4555 14.369 C23.4447 15.3171 23.9999 16.6031 24 17.9439 Z';

function CollectionsIcon({ size = 24, color = '#000' }: IconProps) {
  const px = Number(size);
  return (
    <Svg width={px} height={(px * 23) / 24} viewBox="0 0 24 23">
      <Path d={COLLECTIONS_PATH} fill={color as string} fillRule="evenodd" />
    </Svg>
  );
}

const TAB_ICONS: Record<string, React.ComponentType<IconProps>> = {
  index: IconSparkles,
  dictionary: IconBook2,
  quiz: IconTargetArrow,
  favourites: CollectionsIcon,
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
        <Icon size={ICON_SIZE} color={active ? accent : colors.metaText} />
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
  const ringColor = stageDark ? colors.stageDeep : RING_LIGHT;

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
    color: colors.metaText,
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
