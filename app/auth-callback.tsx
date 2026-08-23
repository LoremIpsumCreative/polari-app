import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth';
import type { Palette } from '../src/lib/palette';
import { useThemedStyles } from '../src/lib/appearance';
import { fonts } from '../src/lib/theme';
import { ScreenBackground } from '../src/components/ScreenBackground';

// Where the OAuth providers land. signInWithProvider hands this path to Supabase
// as its redirectTo, so it has to exist as a route: without it the provider
// returns to a URL the router cannot match and drops the reader on "Unmatched
// Route" while holding a perfectly good session.
//
// There is nothing to do here but wait. On web `detectSessionInUrl` takes the
// tokens off the fragment as the client boots and the session arrives through
// AuthProvider; on native the deep link is caught by openAuthSessionAsync and
// this screen never renders. Either way the only job is to get out of the way
// once the session has been restored.
//
// On a cold return the launch sequence and the gates draw over this screen, so
// its own copy is rarely seen — it is written for the case where it is.
export default function AuthCallbackScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    // `ready` is set from getSession(), which resolves only after supabase-js
    // has finished reading the URL, so a null session at this point means the
    // provider really did come back without one — send those readers somewhere
    // they can act rather than silently home.
    if (!ready) return;
    router.replace(session ? '/' : '/profile/sign-in');
  }, [ready, session, router]);

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <Text style={styles.message}>Signing you in…</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    message: { fontFamily: fonts.semibold, color: colors.text, fontSize: 16 },
  });
