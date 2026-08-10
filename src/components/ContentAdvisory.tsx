import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../lib/theme';
import { useDesignScale } from '../lib/designScale';
import { ScreenBackground } from './ScreenBackground';

// Onboarding/Content Advisory — the note about what this dictionary contains,
// shown once the launch sequence has been dismissed and before the app is
// usable. It is a gate, not a banner: the words below it are the reason it
// exists, so it covers them until it has been acknowledged.
//
// Signed out it appears on every cold start and stores nothing. Signed in it
// appears once per account, recorded on the profile so that reading it on a
// phone also settles it on the web.
const CARD = { left: 38, top: 193, width: 317, height: 466, radius: 20 };
const BUTTON = { left: 85, top: 585, width: 223, height: 50 };

const BODY = [
  'Polari reflects the language and lived realities of its time. This dictionary contains explicit sexual and anatomical language, along with historical terms that may now be considered derogatory or offensive.',
  'It also includes references to sex work, violence, crime, policing and substance use. These terms are preserved for cultural and educational context.',
];

export function ContentAdvisory({ onAcknowledge }: { onAcknowledge: () => void }) {
  const s = useDesignScale();
  const { session } = useAuth();
  // null = still deciding. Rendering the gate before the answer lands would
  // flash it at people who settled it long ago.
  const [needed, setNeeded] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    // Signed out: every cold start, and nothing to look up.
    if (!session) {
      setNeeded(true);
      return;
    }
    supabase
      .from('profiles')
      .select('content_advisory_ack_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        // A missing row reads as "not yet acknowledged", which is the safe way
        // round: showing it once more costs a tap, skipping it wrongly does not.
        setNeeded(!data?.content_advisory_ack_at);
      });
    return () => {
      live = false;
    };
  }, [session]);

  function acknowledge() {
    if (session) {
      // Not awaited: the reader has read it either way, and holding the app
      // shut behind a round trip would be the wrong thing to do if the network
      // is slow. A failed write costs one extra showing.
      supabase
        .from('profiles')
        .update({ content_advisory_ack_at: new Date().toISOString() })
        .eq('id', session.user.id);
    }
    onAcknowledge();
  }

  if (needed !== true) return null;

  return (
    <View style={styles.screen} accessibilityViewIsModal accessibilityRole="alert">
      <ScreenBackground />
      <View
        style={[
          styles.card,
          {
            left: CARD.left * s,
            top: CARD.top * s,
            width: CARD.width * s,
            height: CARD.height * s,
            borderRadius: CARD.radius * s,
            paddingHorizontal: 26 * s,
          },
        ]}
      >
        <Text style={[styles.title, { marginTop: 24 * s, fontSize: 40 * s, lineHeight: 40 * s }]}>
          Content{'\n'}Advisory
        </Text>
        {BODY.map((p) => (
          <Text
            key={p.slice(0, 24)}
            style={[styles.body, { marginTop: 18 * s, fontSize: 14 * s, lineHeight: 18 * s }]}
          >
            {p}
          </Text>
        ))}
      </View>

      <Pressable
        onPress={acknowledge}
        accessibilityRole="button"
        accessibilityLabel="I understand"
        style={({ pressed }) => [
          styles.button,
          {
            left: BUTTON.left * s,
            top: BUTTON.top * s,
            width: BUTTON.width * s,
            height: BUTTON.height * s,
            borderRadius: 999 * s,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonLabel, { fontSize: 14 * s, letterSpacing: 0.3 * s }]}>
          I understand
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: colors.canvas,
  },
  card: { position: 'absolute', backgroundColor: colors.surface, alignItems: 'center' },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.semibold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  button: {
    position: 'absolute',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontFamily: fonts.bold, color: colors.onPrimary },
  pressed: { opacity: 0.8 },
});
