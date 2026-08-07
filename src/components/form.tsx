import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconCaretLeftFilled } from '@tabler/icons-react-native';
import { colors, radii, spacing, fonts } from '../lib/theme';
import { ScreenBackground } from './ScreenBackground';

// ─────────────────────────────────────────────────────────────────────────────
// The Account form kit.
//
// Geometry sampled off the 393x852 exports of the Account frames (Change
// Password 2149:3060, Create Account 2444:2697, Create Account Success
// 2444:2758, Forgot Password). Every one of them is the same skeleton:
//
//   back chip   y52  h31, x17, Neutral/50 pill
//   title       y89  display 36/40, centred
//   card        y186 x27 w340, 1px Neutral/300 edge, radius 14
//   CTA         y659 w243 h50, centred blue pill
//
// so the pieces live here rather than being re-typed per screen.
// ─────────────────────────────────────────────────────────────────────────────

/** Chip that walks back to the Account tab. Drawn in-canvas — these screens
 *  run with `headerShown: false` because the frames put the title below it. */
export function BackChip({ label = 'Account', to = '/profile' }: { label?: string; to?: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(to as never))}
      style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
    >
      <IconCaretLeftFilled size={9} color={colors.text} />
      <Text style={styles.backChipText}>{label}</Text>
    </Pressable>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.screenTitle}>{children}</Text>;
}

/** The white form card at x27 w340. */
export function FormCard({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * A labelled input whose label is *notched into* the pill's outline rather
 * than stacked above it — the label paints the card colour behind itself, so
 * it masks the stroke it straddles. That break in the outline is the detail
 * that reads as "Polari form field"; a label sitting above a closed pill is
 * the generic version, and is what these screens had before.
 */
export function FieldsetInput({
  label,
  notchColor = colors.surface,
  ...inputProps
}: TextInputProps & { label: string; notchColor?: string }) {
  return (
    <View style={styles.fieldset}>
      <TextInput
        style={styles.fieldsetInput}
        placeholderTextColor={colors.inactive}
        accessibilityLabel={label}
        {...inputProps}
      />
      <Text style={[styles.fieldsetLabel, { backgroundColor: notchColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export const PASSWORD_RULES: { label: string; ok: (pw: string) => boolean }[] = [
  { label: 'At least 8 characters', ok: (pw) => pw.length >= 8 },
  { label: 'At least 1 lowercase letter', ok: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 uppercase letter', ok: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 number or symbol', ok: (pw) => /[^A-Za-z]/.test(pw) },
];

export const meetsPasswordRules = (pw: string) => PASSWORD_RULES.every((r) => r.ok(pw));

/** The checklist under the password fields. Rules turn green once met — the
 *  frame has no met-state, but it is the obvious live behaviour and the
 *  Change Password screen already did it. */
export function PasswordRules({ value }: { value: string }) {
  return (
    <View style={styles.rules}>
      <Text style={styles.rulesTitle}>Your password must include:</Text>
      {PASSWORD_RULES.map((r) => {
        const met = value.length > 0 && r.ok(value);
        return (
          <View key={r.label} style={styles.ruleRow}>
            <Text style={[styles.ruleBullet, met && styles.ruleMet]}>·</Text>
            <Text style={[styles.rule, met && styles.ruleMet]}>{r.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** The blue CTA pill at y659 w243 h50. */
export function PillButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.pill,
        style,
        (pressed || disabled || loading) && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={styles.pillText}>{title}</Text>
      )}
    </Pressable>
  );
}

/** The outlined variant — "Open Email" on the success card, w216 h50, 2px edge. */
export function OutlinePillButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outlinePill, style, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.outlinePillText}>{title}</Text>
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.notice}>{message}</Text>;
}

/** Kept for Feedback, which predates these frames and has no mockup of its own. */
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, (pressed || disabled || loading) && styles.pressed]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export { ScreenBackground };

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },

  // Chip y52..82 (h31) at x17, Neutral/50 on the canvas.
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 52,
    marginLeft: 17,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.inset,
  },
  // lineHeight is pinned, not left to `normal`. Resolved from font metrics it
  // measures 12 before Digitale loads and 13 after, which moves the chip's
  // bottom edge — and with it the title, card and CTA — by a pixel depending
  // on when you look. 9 + 13 + 9 = the frame's 31-tall chip, always.
  backChipText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.text,
  },

  // The frames put the cap line of every title on y89 exactly, and Mouse
  // Memoirs at 36 already measures their widths to within 2px — no tracking
  // needed. The 40px line box seats those caps 8 below its own top, so the box
  // starts at 81 — a 2px negative margin against the chip's bottom edge of 83.
  screenTitle: {
    marginTop: -2,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
  },

  // Card box x26..367 — 342 wide, which is a half-pixel margin either side, so
  // it centres rather than carrying a whole-number horizontal margin.
  card: {
    // 65 off the title's line box (which ends at 121) puts the card edge on
    // y186. The box sits 8 higher than the caps it draws, hence 65 not 57.
    marginTop: 65,
    alignSelf: 'center',
    width: 342,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // Pill outer edge to outer edge y209..253 = 45, outline broken by the label.
  fieldset: { position: 'relative' },
  fieldsetInput: {
    height: 45,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    // 20 = the label's own inset, so entered text lines up under its label.
    paddingHorizontal: 20,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.text,
  },
  // Straddles the top stroke, painting the card colour across the span it
  // covers so the outline reads as notched. 10px: the caps measure 7px tall
  // in the exports (y207..213), which is a 10px Digitale cap — the 8 this
  // was built with rendered the labels a fifth too small.
  fieldsetLabel: {
    position: 'absolute',
    top: -5,
    left: 16,
    paddingHorizontal: 4,
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },

  // The checklist is indented 18 past the field edge and set solid — 13px
  // pitch with no gap between rows, which is what the frames measure.
  // The -5 bottom trims the leading React Native hangs under the last line but
  // Figma's text block does not, so a card that ends in the checklist closes on
  // y583 like the frame instead of five short of it.
  rules: { marginTop: 6, marginLeft: 18, marginBottom: -4 },
  rulesTitle: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  ruleRow: { flexDirection: 'row', marginLeft: 7 },
  // A fixed cell rather than a space after the bullet: the frames leave 9px
  // between the dot and the text, which no single space at 10px can give.
  ruleBullet: {
    width: 11,
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    color: colors.textFaint,
  },
  rule: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  ruleMet: { color: colors.correct },

  // CTA x76 y659 w243 h50. The frames vary 236–243 across labels (the Figma
  // button hugs its text); 243 is the value the Change Password frame records
  // and the widest, so every screen uses it and the labels centre inside.
  pill: {
    alignSelf: 'center',
    width: 243,
    height: 50,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },

  // Open Email x89 w216 h50, 2px blue edge on white.
  outlinePill: {
    alignSelf: 'center',
    width: 216,
    height: 50,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinePillText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.primary,
  },

  error: {
    marginTop: 18,
    marginHorizontal: 27,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  notice: {
    marginTop: 18,
    marginHorizontal: 27,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.correct,
    textAlign: 'center',
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
});
