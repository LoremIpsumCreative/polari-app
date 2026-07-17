import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import {
  IconBook2,
  IconHeart,
  IconLayoutDashboard,
  IconPhoto,
  IconSparkles,
  IconTargetArrow,
  IconTrophy,
  IconUserCircle,
  type IconProps,
} from '@tabler/icons-react-native';
import { colors, fonts, tabAccents } from '../lib/theme';
import { useStageDark } from '../lib/stageDark';
import { QUIZ_MODES, QUIZ_MODE_ORDER } from '../lib/quizModes';

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

// Collection satellite fan
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
  profile: IconUserCircle,
};


type Satellite = {
  key: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
  disabled: boolean;
};

// Tabs that open a satellite fan instead of just navigating. Collection fans out
// its sub-screens; Quiz fans out the three game modes.
const FAN_TABS: Record<string, Satellite[]> = {
  favourites: [
    { key: 'favourites', label: 'Favourites', Icon: IconHeart, disabled: false },
    { key: 'achievements', label: 'Achievements', Icon: IconTrophy, disabled: false },
    { key: 'gallery', label: 'Gallery', Icon: IconPhoto, disabled: false },
  ],
  quiz: QUIZ_MODE_ORDER.map((id) => ({
    key: id,
    label: QUIZ_MODES[id].label,
    Icon: QUIZ_MODES[id].Icon,
    disabled: false,
  })),
};

// RN-web only supports the JS animation driver
const useNative = Platform.OS !== 'web';

// The route "base" (strips the auto "/index") if this tab has a fan, else null.
function fanBaseFor(routeName: string): string | null {
  const base = routeName.replace(/\/index$/, '');
  return base in FAN_TABS ? base : null;
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

function SatelliteFan({
  satellites,
  progress,
  centerX,
  open,
  onSelect,
  accent,
}: {
  satellites: Satellite[];
  progress: Animated.Value;
  centerX: number;
  open: boolean;
  onSelect: (key: string) => void;
  accent: string;
}) {
  return (
    <>
      {satellites.map((sat, i) => {
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
                color={sat.disabled ? colors.textFaint : accent}
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
  // Which tab's fan is open (route base) — null when closed.
  const [fanRoute, setFanRoute] = useState<string | null>(null);

  const fanIndex = fanRoute
    ? state.routes.findIndex((r) => fanBaseFor(r.name) === fanRoute)
    : -1;
  const fanSatellites = fanRoute ? FAN_TABS[fanRoute] : [];

  const activeRoute = state.routes[state.index];
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

  // Leaving the fan's tab always folds it away
  const activeBase = activeRoute?.name.replace(/\/index$/, '') ?? '';
  useEffect(() => {
    if (fanRoute && activeBase !== fanRoute) setFanRoute(null);
  }, [activeBase, fanRoute]);

  useEffect(() => {
    Animated.spring(fanProgress, {
      toValue: fanRoute ? 1 : 0,
      useNativeDriver: useNative,
      friction: 8,
      tension: 70,
    }).start();
  }, [fanRoute, fanProgress]);

  function handleSatelliteSelect(key: string) {
    const from = fanRoute;
    setFanRoute(null);
    if (from === 'favourites') {
      // The collection route already shows favourites; the others push in-stack.
      if (key === 'achievements') router.push('/favourites/achievements');
      else if (key === 'gallery') router.push('/favourites/gallery');
    } else if (from === 'quiz') {
      // Each mode starts a game; the play screen runs the countdown first.
      router.push(`/quiz/play?mode=${key}`);
    }
  }

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

      {tabWidth > 0 && fanIndex >= 0 ? (
        <SatelliteFan
          satellites={fanSatellites}
          progress={fanProgress}
          centerX={fanIndex * tabWidth + tabWidth / 2}
          open={!!fanRoute}
          onSelect={handleSatelliteSelect}
          accent={(fanRoute && tabAccents[fanRoute]) || colors.primary}
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

            const base = fanBaseFor(route.name);
            if (base) {
              if (active) {
                setFanRoute((open) => (open === base ? null : base));
              } else {
                navigation.navigate(route.name, route.params);
                setFanRoute(base);
              }
              return;
            }

            setFanRoute(null);
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
    backgroundColor: colors.surface,
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
