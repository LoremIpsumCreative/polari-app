import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconChevronDown, IconChevronUp, type IconProps } from '@tabler/icons-react-native';
import { colors, fonts } from '../lib/theme';

// Button/Account Option (Figma 2154:3240 and siblings) — the row every Account
// section is built from: a 26px circle badge, a 10px Bold label, and a
// trailing chevron. Rows that expand render their body beneath the header.
export function AccountOption({
  label,
  Icon,
  onPress,
  expandable,
  expanded,
  children,
}: {
  label: string;
  Icon: ComponentType<IconProps>;
  onPress?: () => void;
  expandable?: boolean;
  expanded?: boolean;
  children?: ReactNode;
}) {
  const Chevron = expanded ? IconChevronUp : IconChevronDown;
  return (
    <View style={styles.option}>
      <Pressable
        style={styles.header}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={expandable ? { expanded: !!expanded } : undefined}
      >
        <View style={styles.badge}>
          <Icon size={14} color={colors.textFaint} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Chevron size={12} color={colors.text} />
      </Pressable>
      {expanded && children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.metaText,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.inset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  body: { marginTop: 16, gap: 12 },
});
