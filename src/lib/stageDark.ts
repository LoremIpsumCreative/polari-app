import { useSyncExternalStore } from 'react';

// Whether the currently-visible screen is a dark quiz stage. The tab bar's
// selection-bubble ring must match whatever backdrop sits behind it, and the
// quiz tab mixes dark screens (landing, countdown) with light ones (questions,
// results) on the same route — so screens declare it rather than the tab bar
// guessing from route names.
let dark = false;
const subscribers = new Set<() => void>();

export function setStageDark(value: boolean) {
  if (dark === value) return;
  dark = value;
  subscribers.forEach((notify) => notify());
}

export function useStageDark(): boolean {
  return useSyncExternalStore(
    (notify) => {
      subscribers.add(notify);
      return () => subscribers.delete(notify);
    },
    () => dark
  );
}
