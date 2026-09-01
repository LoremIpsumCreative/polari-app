import { createContext, useContext, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { supabase } from './supabase';
import { CHARACTER_SLUGS, characterArtFor } from './characterArt';
import { slugFromAssetName } from './characterAssetName';
import { CHARACTER_ART_OBJECTS } from './artManifest';

// Character artwork lives in the public "characters" storage bucket, keyed by
// word slug (e.g. bull_polari.png). The bucket is the source of truth so new or
// updated art goes live without an app release; the PNGs bundled in
// assets/characters remain as an offline/first-paint fallback.
//
// This used to discover the bucket's contents with storage.list() in an effect,
// then build each URL with a `?v=<updated_at>` cache buster. Both were costly:
//
//   · the listing was a network round trip on every launch, and
//   · the cache buster changed whenever an object's METADATA changed, not just
//     its bytes — so re-applying the bucket's cache-control policy on 1 Sep
//     silently invalidated every cached image at once.
//
// The names now come from src/lib/artManifest.ts, regenerated daily by the art
// check that already watches the bucket, and getPublicUrl() turns a name into a
// URL with pure string concatenation. Nothing here touches the network, so the
// whole map can be built once at module scope.
//
// The trade: art dropped into the bucket appears on the next deploy (the art
// job commits daily) rather than the next app launch. Objects are served with
// max-age=31536000, so instant pickup was already an illusion for anyone who
// had loaded the app before — see the note on overwriting art below.

const BUCKET = 'characters';

/**
 * slug → a stable `{ uri }` source, built once.
 *
 * Stable identity matters as much as the stable URL: a fresh object per call
 * would invalidate every consumer's useMemo on each render.
 *
 * NOTE ON REPLACING ART: because the URL carries no version, overwriting
 * `x_polari.png` in place will not reach anyone whose browser already cached
 * it for the year the bucket's cache-control buys. Ship replacement art under a
 * new object name instead.
 */
const REMOTE_ART: ReadonlyMap<string, ImageSourcePropType> = new Map(
  CHARACTER_ART_OBJECTS.map((name) => [
    slugFromAssetName(name),
    { uri: supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl },
  ]),
);

type RemoteArtContextValue = {
  artFor: (slug: string) => ImageSourcePropType;
  hasArt: (slug: string) => boolean;
  // Every slug with finished art (remote ∪ bundled), for the Gallery
  castSlugs: string[];
};

// Frozen for the life of the process, which is the point: consumers that key a
// useMemo off `artFor` or `castSlugs` (the Gallery, the dictionary's "has
// artwork" filter) now never recompute, where before they all recomputed once
// when the listing landed.
const VALUE: RemoteArtContextValue = {
  artFor: (slug) => REMOTE_ART.get(slug) ?? characterArtFor(slug),
  hasArt: (slug) => REMOTE_ART.has(slug) || CHARACTER_SLUGS.includes(slug),
  castSlugs: [...new Set([...REMOTE_ART.keys(), ...CHARACTER_SLUGS])],
};

const RemoteArtContext = createContext<RemoteArtContextValue | null>(null);

// The provider no longer fetches anything, but it stays: it is what the "must
// be used within a RemoteArtProvider" contract is checked against, and it keeps
// the seam for a future runtime refresh in one place.
export function RemoteArtProvider({ children }: { children: ReactNode }) {
  return <RemoteArtContext.Provider value={VALUE}>{children}</RemoteArtContext.Provider>;
}

export function useCharacterArt(): RemoteArtContextValue {
  const ctx = useContext(RemoteArtContext);
  if (!ctx) throw new Error('useCharacterArt must be used within a RemoteArtProvider');
  return ctx;
}
