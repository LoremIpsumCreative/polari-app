import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// expo-secure-store has no native Keychain/Keystore backing on web, so fall back to
// localStorage there. Native (iOS/Android) uses SecureStore for encrypted session storage.
// expo-secure-store keys may only contain [A-Za-z0-9._-], but Supabase's storage
// keys (e.g. "sb-<ref>-auth-token") already satisfy that, so no key sanitizing needed.
const storage: SupportedStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
        setItem: (key, value) => {
          globalThis.localStorage?.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key) => {
          globalThis.localStorage?.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    // Web only: lets password-recovery email links (tokens in the URL fragment)
    // establish their temporary session on /reset-password.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
