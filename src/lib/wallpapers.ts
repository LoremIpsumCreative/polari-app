import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Full-bleed character wallpapers for the launch screen's carousel. They live
// in the public "character wallpapers" bucket — note the space in the name,
// which supabase-js encodes for us — so new art appears without an app
// release, the same arrangement the `characters` bucket uses for word art.
//
// Cache busting rides on each object's updated_at, so overwriting a file in
// the bucket shows up on the next launch.
const BUCKET = 'character wallpapers';

/** Fisher-Yates. A fresh order every launch is the whole point of the carousel. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A shuffled list of wallpaper URLs, or an empty array while it loads and if
 * the bucket cannot be reached.
 *
 * Empty is a normal state, not an error: the launch screen has to open on a
 * cold start with no network, so it falls back to the plain canvas rather than
 * blocking on this. Callers should render happily with nothing.
 */
export function useWallpapers() {
  const [uris, setUris] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
      if (cancelled || error || !data) return;
      const found = data
        .filter((o) => /\.(png|jpe?g|webp)$/i.test(o.name))
        .map((o) => {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(o.name);
          return `${pub.publicUrl}?v=${encodeURIComponent(o.updated_at ?? '')}`;
        });
      setUris(shuffle(found));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return uris;
}
