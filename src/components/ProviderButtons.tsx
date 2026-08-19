import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import DiscordLogo from './brand/discord-logo.svg';
import FacebookLogo from './brand/facebook-logo.svg';
import GoogleLogo from './brand/google-logo.svg';
import XLogo from './brand/x-logo.svg';
import DiscordLogoDark from './brand/discord-logo_dark.svg';
import FacebookLogoDark from './brand/facebook-logo_dark.svg';
import GoogleLogoDark from './brand/google-logo_dark.svg';
import XLogoDark from './brand/x-logo_dark.svg';
import type { Palette, Scheme } from '../lib/palette';
import { useAppearance, useThemedStyles } from '../lib/appearance';
import { fonts, radii } from '../lib/theme';
import {
  OAUTH_PROVIDERS,
  PROVIDER_LABELS,
  signInWithProvider,
  type OAuthProvider,
} from '../lib/oauth';

// The social block on the Sign In frame: an OR rule, then one full-width
// surface card per provider — brand mark left, centred "Continue with …".
//
// The marks are the official brand SVGs, so they carry their own colour and
// are never tinted — Google's G is multicolour, and every one of these brands
// forbids recolouring its mark. Only the spinner that stands in for a mark
// mid-flight takes a colour, and that is a Polari element, not a brand one.
//
// Each brand publishes a solid-white monochrome mark for dark surfaces, which
// is what the `dark` files are. Note Google's dark variant is white, not the
// multicolour G — that is the sanctioned treatment on a dark background, not a
// recolour of the colour mark.
//
// To add another: drop `<brand>-logo_dark.svg` in ./brand and give it a `dark`
// key. Nothing else needs to change.
const BRAND_ICONS: Record<OAuthProvider, { light: React.FC<SvgProps>; dark?: React.FC<SvgProps> }> =
  {
    google: { light: GoogleLogo, dark: GoogleLogoDark },
    facebook: { light: FacebookLogo, dark: FacebookLogoDark },
    twitter: { light: XLogo, dark: XLogoDark },
    discord: { light: DiscordLogo, dark: DiscordLogoDark },
  };

const markFor = (provider: OAuthProvider, scheme: Scheme): React.FC<SvgProps> => {
  const entry = BRAND_ICONS[provider];
  return scheme === 'dark' && entry.dark ? entry.dark : entry.light;
};

export function OrDivider({ label = 'OR' }: { label?: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.orRow}>
      <View style={styles.rule} />
      <Text style={styles.orText}>{label}</Text>
      <View style={styles.rule} />
    </View>
  );
}

/**
 * `onError` receives a message to show, or null when the reader simply backed
 * out of the provider sheet — a cancel is not a failure and must not leave an
 * error sitting on the screen.
 */
export function ProviderButtons({ onError }: { onError: (message: string | null) => void }) {
  const { colors, scheme } = useAppearance();
  const styles = useThemedStyles(makeStyles);
  // Which provider is mid-flight, so only that row shows a spinner while all
  // of them lock — a second tap during an open auth session goes nowhere good.
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  async function handlePress(provider: OAuthProvider) {
    if (pending) return;
    onError(null);
    setPending(provider);
    const result = await signInWithProvider(provider);
    setPending(null);
    if (!result.ok) onError(result.message);
    // On success there is nothing to do: the auth listener in AuthProvider
    // picks up the new session and the Account screen re-renders itself.
  }

  return (
    <View style={styles.stack}>
      {OAUTH_PROVIDERS.map((provider) => {
        const Icon = markFor(provider, scheme);
        const label = PROVIDER_LABELS[provider];
        const busy = pending === provider;
        return (
          <Pressable
            key={provider}
            onPress={() => handlePress(provider)}
            disabled={pending !== null}
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${label}`}
            accessibilityState={{ disabled: pending !== null, busy }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              pending !== null && !busy && styles.dimmed,
            ]}
          >
            <View style={styles.mark}>
              {busy ? (
                <ActivityIndicator size="small" color={colors.textFaint} />
              ) : (
                <Icon width={20} height={20} />
              )}
            </View>
            <Text style={styles.label}>Continue with {label}</Text>
            {/* Balances the mark so the label stays optically centred. */}
            <View style={styles.mark} />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // 342 centred is FormCard's own geometry (form.tsx) — the OR rule and the
    // provider rows sit on the card's edges in the frame, not the screen's.
    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 24,
      width: 342,
      alignSelf: 'center',
    },
    rule: { flex: 1, height: 1, backgroundColor: colors.fieldBorder },
    orText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: colors.textFaint,
    },

    stack: { gap: 10, marginTop: 18, width: 342, alignSelf: 'center' },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 46,
      paddingHorizontal: 14,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.cardBorder,
    },
    // Fixed and equal on both ends so the centred label does not shift between
    // rows as the brand marks change width.
    mark: { width: 24, alignItems: 'center', justifyContent: 'center' },
    label: {
      flex: 1,
      textAlign: 'center',
      fontFamily: fonts.bold,
      fontSize: 13,
      letterSpacing: 0.3,
      color: colors.text,
    },
    pressed: { opacity: 0.85 },
    dimmed: { opacity: 0.5 },
  });
