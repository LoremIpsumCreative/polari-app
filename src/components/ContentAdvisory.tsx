import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Palette } from '../lib/palette';
import { useThemedStyles } from '../lib/appearance';
import { fonts } from '../lib/theme';
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
const CARD = { left: 38, top: 168, width: 317, height: 512, radius: 20 };
const BUTTON = { left: 62, top: 610, width: 269, height: 50 };

// The advisory now states an age and the button is an affirmation rather than an
// acknowledgement — "I confirm that I am aged 15 or over" is a claim the reader
// makes, so the wording of both has to agree on the same number.
const BODY = [
  'Polari reflects the language and lived realities of its time. The dictionary contains explicit sexual and anatomical language, historical terms that may now be considered derogatory or offensive, and references to sex work, violence, crime, policing and substance use.',
  'This material is included to preserve the language faithfully and provide cultural and educational context.',
];
const AGE_STATEMENT = 'Polari is intended for audiences aged 15 and over.';
const CONFIRM_LABEL = 'I confirm that I am aged 15 or over';

export function ContentAdvisory({ onAcknowledge }: { onAcknowledge: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const s = useDesignScale();
  const { session, ready } = useAuth();
  // null = still deciding. Rendering the gate before the answer lands would
  // flash it at people who settled it long ago.
  const [needed, setNeeded] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    // Nothing is decidable until the persisted session has been restored.
    // Deciding while it is still null treats a signed-in reader as signed out:
    // the gate shows, and the tap that dismisses it writes nothing, so it comes
    // back on the next launch and never settles.
    if (!ready) return;
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
  }, [session, ready]);

  function acknowledge() {
    if (session) {
      // Not awaited: the reader has read it either way, and holding the app
      // shut behind a round trip would be the wrong thing to do if the network
      // is slow. A failed write costs one extra showing.
      // Upsert rather than update: an update against a missing profile row
      // matches nothing and reports no error, which would silently reshow the
      // advisory forever. The insert policy exists for exactly this.
      supabase
        .from('profiles')
        .upsert({ id: session.user.id, content_advisory_ack_at: new Date().toISOString() });
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
        {/* The age line is the operative sentence — the button asks the reader to
            confirm it — so it is set bold rather than run in with the prose. */}
        <Text
          style={[styles.ageStatement, { marginTop: 18 * s, fontSize: 14 * s, lineHeight: 18 * s }]}
        >
          {AGE_STATEMENT}
        </Text>
      </View>

      <Pressable
        onPress={acknowledge}
        accessibilityRole="button"
        accessibilityLabel={CONFIRM_LABEL}
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
          {CONFIRM_LABEL}
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
    ageStatement: {
      fontFamily: fonts.bold,
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
