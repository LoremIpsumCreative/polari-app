import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Type-only deep import: expo-router 57 vendors react-navigation's bottom-tabs
// and doesn't re-export its types from the package root.
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, tabAccents } from '../lib/theme';
import { NavIcon, navIconSize, isNavIconName, type NavIconName } from './navIcons';

// Figma "Navbar 2.0" (node 1766:3478). The bar is a single boolean shape 394x101
// with a scoop cut out of its top edge, and the selected tab's 55px white circle
// floats in that scoop. Because the notch is a genuine hole rather than a ring
// painted to match the backdrop, whatever is behind the bar — including the
// quiz's dark gradient stage — shows through it correctly.
const DESIGN_WIDTH = 394;
const BAR_HEIGHT = 101;

// The scoop, measured from the Today variant's path and re-expressed relative to
// the selected tab's centre. Every variant in the component is this same curve
// translated; the two end variants simply have it clipped by the bar's edge.
const NOTCH_HALF_WIDTH = 68.5;
const NOTCH_DEPTH = 44;
// The scoop is very slightly asymmetric — its leading outer control reaches
// 39.886 out while the trailing one reaches 37.285. That holds across all five
// variants, so it is reproduced rather than averaged away.
const NOTCH_LEAD_OUTER = 39.886; // outer control, on the bar's top edge
const NOTCH_INNER = 37.353; // both inner controls, at full depth
const NOTCH_TRAIL_OUTER = 37.285;

const BUBBLE_SIZE = 55;
// The circle's centre sits 4.5 above the bar's top edge, so it overhangs by 23.
const BUBBLE_TOP = -23;
const ACTIVE_ICON_CENTER = 4.5; // dead centre of the bubble
const RESTING_ICON_CENTER = 41.5;
// The mockup measures labels from their cap line (y71). Digitale's cap height is
// exactly 7 at 10px and its baseline sits 8.5 below the top of a 10px line box,
// so the box itself has to start 1.5 above that cap line.
const LABEL_CAP_TOP = 71;
const LABEL_BOX_TOP = LABEL_CAP_TOP - 1.5;
const LABEL_SIZE = 10;
// Tabs sit on an even 70px pitch about the bar's centre line. The mockup's own
// nodes wander by up to 1.5px from that pitch (they were placed by hand); the
// even spacing is plainly the intent and keeps the bar symmetrical.
const TAB_PITCH = 70;

// The bubble's top half overhangs the bar into the screen above it, so screens
// must keep this much clear at the bottom or their content collides with it.
export const TAB_BUBBLE_OVERHANG = -BUBBLE_TOP;
export const TAB_CONTENT_CLEARANCE = TAB_BUBBLE_OVERHANG + 20;

const TAB_ICONS: Record<string, NavIconName> = {
  favourites: 'collections',
  dictionary: 'dictionary',
  index: 'today',
  quiz: 'quiz',
  profile: 'account',
};

// RN-web only supports the JS animation driver
const useNative = Platform.OS !== 'web';

// The bar outline: a full-width rectangle whose top edge dives into the scoop
// centred on `cx`. When the selected tab is at either end the curve runs past
// the bar's edge and the SVG viewport clips it, which is exactly how the Figma
// Collections and Account variants are drawn.
function barPath(width: number, height: number, cx: number, s: number) {
  const half = NOTCH_HALF_WIDTH * s;
  const depth = NOTCH_DEPTH * s;
  const lead = NOTCH_LEAD_OUTER * s;
  const inner = NOTCH_INNER * s;
  const trail = NOTCH_TRAIL_OUTER * s;
  return [
    `M${width} ${height}`,
    `L0 ${height}`,
    'L0 0',
    `L${cx - half} 0`,
    `C${cx - lead} 0 ${cx - inner} ${depth} ${cx} ${depth}`,
    `C${cx + inner} ${depth} ${cx + trail} 0 ${cx + half} 0`,
    `L${width} 0`,
    'Z',
  ].join(' ');
}

// The notch has to be redrawn as it slides, so this subscribes to the animated
// centre itself rather than re-rendering the whole bar (and every tab) each
// frame. `d` is a plain string prop — there is no animatable equivalent.
const NotchedBar = memo(function NotchedBar({
  cx,
  initialCx,
  width,
  height,
  s,
}: {
  cx: Animated.Value;
  initialCx: number;
  width: number;
  height: number;
  s: number;
}) {
  const [centre, setCentre] = useState(initialCx);

  useEffect(() => {
    const id = cx.addListener(({ value }) => setCentre(value));
    return () => cx.removeListener(id);
  }, [cx]);

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Path d={barPath(width, height, centre, s)} fill={colors.surface} />
    </Svg>
  );
});

const TabItem = memo(function TabItem({
  label,
  routeName,
  active,
  centre,
  s,
  onPress,
}: {
  label: string;
  routeName: string;
  active: boolean;
  centre: number;
  s: number;
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
  const iconName = TAB_ICONS[base];
  // Every tab lights up in its own colour when active (per the Figma variants).
  const accent = tabAccents[base] ?? colors.primary;

  const travel = (RESTING_ICON_CENTER - ACTIVE_ICON_CENTER) * s;
  // Glyphs are 23-25 tall, so the slot is anchored on the icon's centre line
  // rather than its top edge — otherwise each tab would sit at its own height.
  const glyphHeight = iconName ? navIconSize(iconName, s).height : 0;

  return (
    <Pressable
      style={[styles.tab, { left: centre - (TAB_PITCH * s) / 2, width: TAB_PITCH * s }]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.iconSlot,
          {
            top: RESTING_ICON_CENTER * s - glyphHeight / 2,
            transform: [
              {
                translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] }),
              },
            ],
          },
        ]}
      >
        {iconName && isNavIconName(iconName) ? (
          <NavIcon name={iconName} scale={s} color={active ? accent : colors.metaText} />
        ) : null}
      </Animated.View>
      <Text
        style={[
          styles.label,
          {
            top: LABEL_BOX_TOP * s,
            fontSize: LABEL_SIZE * s,
            lineHeight: LABEL_SIZE * s,
            letterSpacing: 0.7 * s,
            fontFamily: active ? fonts.bold : fonts.semibold,
            color: active ? accent : colors.metaText,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

// Tabs always navigate directly: the screens own their submenus now (the quiz
// landing's permanent mode fan, the Collections hub's satellite buttons), so
// the bar no longer opens a satellite fan of its own.
export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [barWidth, setBarWidth] = useState(width);
  const s = Math.min(width, 430) / DESIGN_WIDTH;

  const barHeight = BAR_HEIGHT * s;
  // Tabs are laid out on an even pitch about the bar's centre, so the row stays
  // centred (and the pitch stays true to the mockup) at any screen width.
  const centreFor = (index: number) =>
    barWidth / 2 + (index - (state.routes.length - 1) / 2) * TAB_PITCH * s;

  const initialCx = useRef(centreFor(state.index)).current;
  const notchX = useRef(new Animated.Value(initialCx)).current;

  useEffect(() => {
    if (barWidth === 0) return;
    Animated.spring(notchX, {
      toValue: centreFor(state.index),
      // The notch drives an SVG path string, which the native driver cannot own.
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, barWidth, s]);

  return (
    <View
      style={[styles.bar, { height: barHeight + insets.bottom }]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {/* The safe-area strip below the bar is solid — only the scoop is open. */}
      <View style={[styles.safeAreaFill, { height: insets.bottom }]} />

      <NotchedBar
        cx={notchX}
        initialCx={initialCx}
        width={barWidth}
        height={barHeight}
        s={s}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            top: BUBBLE_TOP * s,
            width: BUBBLE_SIZE * s,
            height: BUBBLE_SIZE * s,
            borderRadius: (BUBBLE_SIZE * s) / 2,
            marginLeft: -(BUBBLE_SIZE * s) / 2,
            transform: [{ translateX: notchX }],
          },
        ]}
      />

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
            centre={centreFor(index)}
            s={s}
            onPress={handlePress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    // Transparent: the bar's own white comes from the notched path, so the
    // screen behind shows through the scoop.
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  safeAreaFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    backgroundColor: colors.surface,
  },
  tab: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  iconSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});
