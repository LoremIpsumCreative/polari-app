import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { paletteFor, tabAccentsFor, type Palette, type Scheme } from './palette';

// The Appearance section on the Account screen (Figma: Account/Main/Signed In -
// Expanded) offers Light / Dark / System. `mode` is what the reader picked;
// `scheme` is what that resolves to right now — they differ only under System.

export type AppearanceMode = 'light' | 'dark' | 'system';

// expo-secure-store keys may only contain [A-Za-z0-9._-].
const STORE_KEY = 'polari.appearance.mode';

const isMode = (value: unknown): value is AppearanceMode =>
  value === 'light' || value === 'dark' || value === 'system';

// Same split as supabase.ts: SecureStore has no native backing on web.
async function readStoredMode(): Promise<AppearanceMode | null> {
  const raw =
    Platform.OS === 'web'
      ? (globalThis.localStorage?.getItem(STORE_KEY) ?? null)
      : await SecureStore.getItemAsync(STORE_KEY);
  return isMode(raw) ? raw : null;
}

async function writeStoredMode(mode: AppearanceMode): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORE_KEY, mode);
    return;
  }
  await SecureStore.setItemAsync(STORE_KEY, mode);
}

type AppearanceContextValue = {
  mode: AppearanceMode;
  scheme: Scheme;
  colors: Palette;
  tabAccents: Record<string, string>;
  // false until the stored preference has been read, so nothing renders the
  // default and then snaps to the reader's choice a frame later
  ready: boolean;
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  // Follows the OS until the reader chooses otherwise. Note this resolves
  // ahead of the screens: while the per-screen repaint is in flight, a reader
  // whose device is in dark mode gets the dark root under still-light screens.
  // That is the accepted cost of not having to remember to flip it later.
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const [ready, setReady] = useState(false);
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme());

  useEffect(() => {
    let cancelled = false;
    readStoredMode().then((stored) => {
      if (cancelled) return;
      if (stored) setModeState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only meaningful under System, but the listener is cheap and keeping it
  // always-on means switching to System picks up the current OS value at once.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    // Fire-and-forget: the in-memory value is the source of truth for this
    // session, and a failed write only costs the preference on next launch.
    void writeStoredMode(next);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => {
    const scheme: Scheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return {
      mode,
      scheme,
      colors: paletteFor(scheme),
      tabAccents: tabAccentsFor(scheme),
      ready,
      setMode,
    };
  }, [mode, systemScheme, ready, setMode]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used within an AppearanceProvider');
  return ctx;
}

/** The palette for the active scheme. Reach for `useThemedStyles` instead when
 *  the caller only wants a stylesheet — this is for one-off colour props. */
export function useColors(): Palette {
  return useAppearance().colors;
}

/**
 * The migration path off the static `colors` import. Lift the component's
 * `StyleSheet.create({...})` into a module-scope `makeStyles = (c: Palette) =>
 * StyleSheet.create({...})`, then call this in the body.
 *
 * `factory` MUST be defined at module scope. Declared inside the component it
 * is a new function every render, the memo never hits, and every render
 * rebuilds the stylesheet.
 */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const colors = useColors();
  return useMemo(() => factory(colors), [factory, colors]);
}
