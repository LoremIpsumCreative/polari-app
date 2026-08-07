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
  disabled,
  showChevron,
  children,
}: {
  label: string;
  Icon: ComponentType<IconProps>;
  onPress?: () => void;
  expandable?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  // Which rows carry a trailing arrow varies per frame, so it is explicit
  // rather than inferred; expandable rows show one by default.
  showChevron?: boolean;
  children?: ReactNode;
}) {
  // Only the expandable rows carry a chevron — the frame leaves About Polari,
  // Feedback and Sign Out bare.
  const Chevron = expanded ? IconChevronUp : IconChevronDown;
  const chevron = showChevron ?? expandable;
  return (
    <View style={[styles.option, disabled && styles.optionDisabled]}>
      <Pressable
        style={styles.header}
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={expandable ? { expanded: !!expanded } : undefined}
      >
        <View style={[styles.badge, disabled && styles.badgeDisabled]}>
          <Icon size={14} color={disabled ? colors.inactive : colors.textFaint} />
        </View>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        {chevron ? <Chevron size={12} color={disabled ? colors.inactive : colors.text} /> : null}
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
  optionDisabled: { backgroundColor: colors.inset, borderColor: colors.inactive },
  badgeDisabled: { backgroundColor: colors.progressTrack },
  labelDisabled: { color: colors.inactive },
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
