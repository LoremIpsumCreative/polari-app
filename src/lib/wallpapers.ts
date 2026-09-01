import { useState } from 'react';
import { supabase } from './supabase';
import { WALLPAPER_OBJECTS } from './artManifest';

// Full-bleed character wallpapers for the launch screen's carousel. They live
// in the public "character wallpapers" bucket — note the space in the name,
// which supabase-js encodes for us — so new art appears without an app
// release, the same arrangement the `characters` bucket uses for word art.
//
// As with character art, the names come from the generated manifest rather than
// a storage.list() on every launch, and the URLs carry no `?v=` cache buster:
// see the notes in remoteArt.tsx. getPublicUrl() is string concatenation, so
// the whole list is built once at module scope.
const BUCKET = 'character wallpapers';

const WALLPAPER_URIS: readonly string[] = WALLPAPER_OBJECTS.map(
  (name) => supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl,
);

/** Fisher-Yates. A fresh order every launch is the whole point of the carousel. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A shuffled list of wallpaper URLs.
 *
 * Shuffled once per mount, not per render: the launch screen indexes into this
 * array to decide which wallpaper is showing, so a new order on every render
 * would reshuffle the carousel under the reader mid-cross-fade.
 *
 * Having the URLs does not fetch them. The launch screen mounts exactly two at
 * a time — see LaunchScreen — so the bucket is never pulled down wholesale.
 */
export function useWallpapers() {
  const [uris] = useState(() => shuffle(WALLPAPER_URIS));
  return uris;
}
