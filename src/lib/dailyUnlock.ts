import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The Word of the Day arrives gift-wrapped: the first visit to the Today
// screen each day shows a present the user taps to open. The unlock is
// remembered per LOCAL calendar day, device-side, using the same storage
// split as the Supabase session (localStorage on web, SecureStore on native).
const KEY = 'polari-wotd-unlocked';

export function todayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function getUnlockedDate(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function setUnlockedToday(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(KEY, todayKey());
    return;
  }
  await SecureStore.setItemAsync(KEY, todayKey());
}
