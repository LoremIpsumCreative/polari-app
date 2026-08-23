import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Every provider the app knows how to drive, in the order the Sign In frame
// lists them. This is the catalogue, NOT what the reader sees — see
// ENABLED_OAUTH_PROVIDERS below.
export const OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'discord'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

// Supabase still calls X by its old provider id.
export const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  twitter: 'X',
  discord: 'Discord',
};

const isProvider = (v: string): v is OAuthProvider =>
  (OAUTH_PROVIDERS as readonly string[]).includes(v);

/**
 * Which providers actually appear.
 *
 * Google and Discord are shipped. Facebook and X are built and working but
 * stay off outside development, so the default stays the SAFE one: forgetting
 * to configure anything yields the shipped pair rather than exposing every
 * provider by accident. `__DEV__` is false in every `expo export` and release
 * build, which is what makes that hold in production without relying on a
 * dashboard setting being present.
 *
 * A provider named here must also be enabled in the Supabase project's auth
 * settings — one that is not fails at the tap with "Unsupported provider".
 *
 * To widen it — a preview deployment that needs to exercise the others, say —
 * set EXPO_PUBLIC_OAUTH_PROVIDERS on that environment:
 *
 *   EXPO_PUBLIC_OAUTH_PROVIDERS=google,facebook,twitter,discord
 *
 * Unknown names are dropped rather than throwing: a typo in a dashboard field
 * should cost one button, not the whole sign-in screen. Order always follows
 * the frame, not the variable.
 */
function resolveEnabled(): readonly OAuthProvider[] {
  const raw: string | undefined = process.env.EXPO_PUBLIC_OAUTH_PROVIDERS;
  if (raw) {
    const wanted = raw
      .split(',')
      .map((p: string) => p.trim().toLowerCase())
      .filter(isProvider);
    return OAUTH_PROVIDERS.filter((p: OAuthProvider) => wanted.includes(p));
  }
  return __DEV__ ? OAUTH_PROVIDERS : (['google', 'discord'] as const);
}

export const ENABLED_OAUTH_PROVIDERS = resolveEnabled();

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
