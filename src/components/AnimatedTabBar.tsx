import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import {
  IconBook2,
  IconHeart,
  IconLayoutDashboard,
  IconPhoto,
  IconSettings,
  IconSparkles,
  IconTargetArrow,
  IconTrophy,
  type IconProps,
} from '@tabler/icons-react-native';
import { colors, fonts } from '../lib/theme';

const BUBBLE_SIZE = 56;
// The ring around the bubble, painted in the screens' background colour so the
// bubble reads as "cut out" of the bar, like the reference animation
const BUBBLE_RING = 6;
const ICON_SIZE = 26;
const LABEL_HEIGHT = 16;
const ICON_LABEL_GAP = 4;
// Taller bar = the requested extra breathing room below the icons; the
// icon+label column is centred in this full height.
const BAR_CONTENT_HEIGHT = 84;

// Where the icon's centre rests inside the bar (column is vertically centred)
const ICON_REST_CENTER =
  (BAR_CONTENT_HEIGHT - (ICON_SIZE + ICON_LABEL_GAP + LABEL_HEIGHT)) / 2 + ICON_SIZE / 2;
// The bubble's centre sits exactly on the bar's top edge (y = 0), so lifting
// the icon by its resting depth lands it dead-centre in the bubble.
const ICON_LIFT = ICON_REST_CENTER;

// Dashboard satellite fan
const SATELLITE_SIZE = 48;
const SATELLITE_ICON_SIZE = 22;
const FAN_RADIUS = 86;
// Fan arc over the bubble: left, top, right
const FAN_ANGLES_DEG = [145, 90, 35];

const TAB_ICONS: Record<string, React.ComponentType<IconProps>> = {
  index: IconSparkles,
  dictionary: IconBook2,
  quiz: IconTargetArrow,
  favourites: IconLayoutDashboard,
  profile: IconSettings,
};

type Satellite = {
  key: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
  disabled: boolean;
};

const DASHBOARD_SATELLITES: Satellite[] = [
  { key: 'favourites', label: 'Favourites', Icon: IconHeart, disabled: false },
  { key: 'achievements', label: 'Achievements', Icon: IconTrophy, disabled: true },
  { key: 'gallery', label: 'Gallery', Icon: IconPhoto, disabled: true },
];

// RN-web only supports the JS animation driver
const useNative = Platform.OS !== 'web';

function isDashboardRoute(routeName: string): boolean {
  return routeName.replace(/\/index$/, '') === 'favourites';
}

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
                outputRange: [0, -ICON_LIFT],
              }),
            },
            {
              scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
            },
          ],
        }}
      >
        <Icon size={ICON_SIZE} color={active ? colors.onPrimary : 'rgba(255, 255, 255, 0.75)'} />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

function SatelliteFan({
  progress,
  centerX,
  open,
  onSelect,
}: {
  progress: Animated.Value;
  centerX: number;
  open: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <>
      {DASHBOARD_SATELLITES.map((sat, i) => {
        const angle = (FAN_ANGLES_DEG[i] * Math.PI) / 180;
        const dx = Math.cos(angle) * FAN_RADIUS;
        const dy = -Math.sin(angle) * FAN_RADIUS;
        return (
          <Animated.View
            key={sat.key}
            style={[
              styles.satellite,
              {
                left: centerX - SATELLITE_SIZE / 2,
                // While folded away the satellites are invisible but would
                // otherwise still swallow taps meant for the tab bar
                pointerEvents: open ? 'auto' : 'none',
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sat.disabled ? 0.45 : 1],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dx],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, dy],
                    }),
                  },
                  { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                ],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.satelliteButton,
                pressed && !sat.disabled && styles.satellitePressed,
              ]}
              onPress={() => onSelect(sat.key)}
              disabled={sat.disabled}
              accessibilityRole="button"
              accessibilityLabel={sat.label}
              accessibilityState={{ disabled: sat.disabled }}
            >
              <sat.Icon
                size={SATELLITE_ICON_SIZE}
                color={sat.disabled ? 'rgba(255, 255, 255, 0.6)' : colors.onPrimary}
              />
            </Pressable>
            <Text style={styles.satelliteLabel} numberOfLines={1}>
              {sat.label}
            </Text>
          </Animated.View>
        );
      })}
    </>
  );
}

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabCount = state.routes.length;
  const tabWidth = tabCount > 0 ? barWidth / tabCount : 0;

  const bubbleX = useRef(new Animated.Value(0)).current;
  const fanProgress = useRef(new Animated.Value(0)).current;
  const [fanOpen, setFanOpen] = useState(false);

  const dashboardIndex = state.routes.findIndex((r) => isDashboardRoute(r.name));
  const dashboardActive = state.index === dashboardIndex;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(bubbleX, {
      toValue: state.index * tabWidth + tabWidth / 2 - (BUBBLE_SIZE + BUBBLE_RING * 2) / 2,
      useNativeDriver: useNative,
      friction: 7,
      tension: 60,
    }).start();
  }, [state.index, tabWidth, bubbleX]);

  // Leaving the dashboard tab always folds the fan away
  useEffect(() => {
    if (!dashboardActive && fanOpen) setFanOpen(false);
  }, [dashboardActive, fanOpen]);

  useEffect(() => {
    Animated.spring(fanProgress, {
      toValue: fanOpen ? 1 : 0,
      useNativeDriver: useNative,
      friction: 8,
      tension: 70,
    }).start();
  }, [fanOpen, fanProgress]);

  function handleSatelliteSelect(key: string) {
    // Favourites is the only live satellite; the dashboard route already
    // shows the favourites screen, so selecting it just folds the fan.
    if (key === 'favourites') setFanOpen(false);
  }

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          style={[styles.bubble, { transform: [{ translateX: bubbleX }] }]}
        />
      ) : null}

      {tabWidth > 0 && dashboardIndex >= 0 ? (
        <SatelliteFan
          progress={fanProgress}
          centerX={dashboardIndex * tabWidth + tabWidth / 2}
          open={fanOpen}
          onSelect={handleSatelliteSelect}
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

            if (isDashboardRoute(route.name)) {
              if (active) {
                setFanOpen((open) => !open);
              } else {
                navigation.navigate(route.name, route.params);
                setFanOpen(true);
              }
              return;
            }

            setFanOpen(false);
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
    backgroundColor: colors.primary,
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
    color: 'rgba(255, 255, 255, 0.75)',
  },
  labelActive: {
    color: colors.onPrimary,
  },
  bubble: {
    position: 'absolute',
    top: -(BUBBLE_SIZE / 2 + BUBBLE_RING),
    left: 0,
    width: BUBBLE_SIZE + BUBBLE_RING * 2,
    height: BUBBLE_SIZE + BUBBLE_RING * 2,
    borderRadius: (BUBBLE_SIZE + BUBBLE_RING * 2) / 2,
    backgroundColor: colors.primary,
    borderWidth: BUBBLE_RING,
    borderColor: colors.background,
    pointerEvents: 'none',
  },
  satellite: {
    position: 'absolute',
    top: -SATELLITE_SIZE / 2,
    alignItems: 'center',
    // Wider than the circle so labels like "Achievements" don't truncate;
    // the circle stays centred within it.
    width: SATELLITE_SIZE + 44,
    marginLeft: -22,
  },
  satelliteButton: {
    width: SATELLITE_SIZE,
    height: SATELLITE_SIZE,
    borderRadius: SATELLITE_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satellitePressed: {
    opacity: 0.85,
  },
  satelliteLabel: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text,
  },
});
