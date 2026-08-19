import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Social sign-in. The providers enabled in the Supabase dashboard, in the
// order the Sign In frame lists them.
export const OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'discord'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

// Supabase still calls X by its old provider id.
export const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  twitter: 'X',
  discord: 'Discord',
};

export type OAuthResult = { ok: true } | { ok: false; message: string | null };

// `ok: false` with a null message means the reader backed out — the caller
// should fall silent rather than show an error.
const CANCELLED: OAuthResult = { ok: false, message: null };

/**
 * Two genuinely different flows behind one call:
 *
 * web — hand the tab to the provider and let Supabase land back on the app
 *   origin. `detectSessionInUrl` (supabase.ts) picks the tokens off the
 *   fragment on return, so there is nothing to await; this function does not
 *   resolve in the success case, the page navigates away.
 *
 * native — open the provider in an auth session, catch the polariapp:// deep
 *   link it redirects to, and exchange the code for a session by hand.
 *   `skipBrowserRedirect` stops supabase-js from trying to navigate a window
 *   that does not exist.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<OAuthResult> {
  const redirectTo = Linking.createURL('/auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) return { ok: false, message: error.message };

  // Web: supabase-js has already started the redirect.
  if (Platform.OS === 'web') return { ok: true };

  if (!data?.url) return { ok: false, message: 'Could not reach the sign-in page.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return CANCELLED;

  // PKCE returns ?code=…; the implicit flow returns the tokens in the
  // fragment. Handle both so this keeps working if the client flow changes.
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return exchangeError ? { ok: false, message: exchangeError.message } : { ok: true };
  }

  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const access_token = fragment.get('access_token');
  const refresh_token = fragment.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: setError } = await supabase.auth.setSession({ access_token, refresh_token });
    return setError ? { ok: false, message: setError.message } : { ok: true };
  }

  // The provider can also redirect back with an error description rather than
  // a token — surface that instead of a generic failure.
  const described = url.searchParams.get('error_description') ?? fragment.get('error_description');
  return { ok: false, message: described ?? 'Sign-in did not complete. Please try again.' };
}
