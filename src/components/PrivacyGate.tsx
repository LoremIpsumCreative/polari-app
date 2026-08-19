import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Palette } from '../lib/palette';
import { useThemedStyles } from '../lib/appearance';
import { fonts } from '../lib/theme';
import { useDesignScale } from '../lib/designScale';
import { ScreenBackground } from './ScreenBackground';
import { PrivacyPolicyBody } from './PrivacyPolicyBody';

// Onboarding/Privacy Policy (Figma 4210:4130, foot at 4210:4199) — the policy
// with an I agree that only becomes live once the reader has reached the bottom
// of it. Follows the content advisory and gates the app the same way.
//
// The button is disabled rather than hidden, because a control that appears
// only once you have scrolled far enough reads as a glitch; one that is visibly
// waiting for you reads as an instruction.
const CARD = { left: 27, top: 145, width: 339, radius: 12 };
const BUTTON = { width: 187, height: 50, bottom: 96 };

export function PrivacyGate({ onAgree }: { onAgree: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const s = useDesignScale();
  const { session } = useAuth();
  // null = still deciding. Rendering before the answer lands would flash the
  // gate at people who agreed to it long ago.
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [readToEnd, setReadToEnd] = useState(false);

  useEffect(() => {
    let live = true;
    if (!session) {
      // Signed out: every cold start, and nothing to look up. The same shape as
      // the content advisory, for the same reason — there is no account to
      // record it against.
      setNeeded(true);
      return;
    }
    supabase
      .from('profiles')
      .select('privacy_agreed_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setNeeded(!data?.privacy_agreed_at);
      });
    return () => {
      live = false;
    };
  }, [session]);

  function agree() {
    if (session) {
      // Not awaited: the reader has read it either way, and holding the app
      // shut behind a round trip would be wrong on a slow connection. A failed
      // write costs one extra showing.
      supabase
        .from('profiles')
        .upsert({ id: session.user.id, privacy_agreed_at: new Date().toISOString() });
    }
    onAgree();
  }

  if (needed !== true) return null;

  return (
    <View style={styles.screen} accessibilityViewIsModal accessibilityRole="alert">
      <ScreenBackground />

      <Text style={[styles.title, { top: 84 * s, fontSize: 28 * s, lineHeight: 30 * s }]}>
        Privacy Policy
      </Text>

      <View
        style={[
          styles.card,
          {
            left: CARD.left * s,
            top: CARD.top * s,
            width: CARD.width * s,
            borderRadius: CARD.radius * s,
            bottom: (BUTTON.bottom + BUTTON.height + 24) * s,
          },
        ]}
      >
        <PrivacyPolicyBody onReachedEnd={() => setReadToEnd(true)} />
      </View>

      <Pressable
        onPress={agree}
        disabled={!readToEnd}
        accessibilityRole="button"
        accessibilityLabel="I agree"
        accessibilityState={{ disabled: !readToEnd }}
        accessibilityHint={readToEnd ? undefined : 'Scroll to the end of the policy to continue'}
        style={({ pressed }) => [
          styles.button,
          {
            width: BUTTON.width * s,
            height: BUTTON.height * s,
            bottom: BUTTON.bottom * s,
            borderRadius: 999 * s,
          },
          !readToEnd && styles.buttonDisabled,
          pressed && readToEnd && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
          I agree
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundColor: colors.canvas,
      alignItems: 'center',
    },
    title: {
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: fonts.display,
      color: colors.text,
    },
    card: {
      position: 'absolute',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.fieldBorder,
      overflow: 'hidden',
    },
    button: {
      position: 'absolute',
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Dimmed rather than greyed: it is the same button, not a different one.
    buttonDisabled: { opacity: 0.4 },
    buttonLabel: { fontFamily: fonts.bold, color: colors.onPrimary },
    pressed: { opacity: 0.8 },
  });
