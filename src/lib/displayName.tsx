import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { DISPLAY_NAME_REJECTED, checkDisplayNameFormat } from './nameModeration';

// The signed-in reader's display name, read from public.profiles rather than
// auth metadata. It was in user_metadata.first_name, which is the wrong home
// for it: metadata is writable by the client with no server-side validation, so
// the moderation trigger could never see it.
//
// `ready` distinguishes "no name yet" from "haven't looked yet" — the onboarding
// gate turns on that difference and would otherwise flash at everyone.

type DisplayNameValue = {
  displayName: string | null;
  ready: boolean;
  /** Returns null on success, or a message to show the reader. */
  save: (next: string) => Promise<string | null>;
};

const DisplayNameContext = createContext<DisplayNameValue | undefined>(undefined);

export function DisplayNameProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    if (!session) {
      setDisplayName(null);
      // Signed out there is nothing to fetch and nothing to complete, so this
      // is settled rather than pending.
      setReady(true);
      return;
    }
    setReady(false);
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        setDisplayName(data?.display_name ?? null);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, [session]);

  const save = useCallback(
    async (next: string): Promise<string | null> => {
      if (!session) return 'You need to be signed in.';
      const trimmed = next.trim();

      // Shape first, so the obvious problems get a specific message instead of
      // the deliberately vague moderation one.
      const format = checkDisplayNameFormat(trimmed);
      if (format) return format;

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session.user.id, display_name: trimmed })
        .select('display_name')
        .maybeSingle();

      if (error) {
        // The trigger raises check_violation with a bare code; anything else is
        // a genuine failure and should read as one.
        if (/display_name_not_allowed/.test(error.message)) return DISPLAY_NAME_REJECTED;
        if (/display_name_invalid/.test(error.message)) return 'That display name isn’t valid.';
        return 'Could not save your display name. Please try again.';
      }

      setDisplayName(trimmed);
      return null;
    },
    [session],
  );

  const value = useMemo<DisplayNameValue>(
    () => ({ displayName, ready, save }),
    [displayName, ready, save],
  );

  return <DisplayNameContext.Provider value={value}>{children}</DisplayNameContext.Provider>;
}

export function useDisplayName(): DisplayNameValue {
  const ctx = useContext(DisplayNameContext);
  if (!ctx) throw new Error('useDisplayName must be used inside DisplayNameProvider');
  return ctx;
}
