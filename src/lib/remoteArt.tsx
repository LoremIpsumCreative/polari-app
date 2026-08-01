import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ImageSourcePropType } from 'react-native';
import { supabase } from './supabase';
import { CHARACTER_SLUGS, characterArtFor } from './characterArt';
import { slugFromAssetName } from './characterAssetName';

// Character artwork lives in the public "characters" storage bucket, keyed by
// word slug (e.g. bull.png). The bucket is the source of truth so new or
// updated art goes live without an app release; the PNGs bundled in
// assets/characters remain as an offline/first-paint fallback. Cache busting
// rides on each object's updated_at, so overwriting a file in the bucket shows
// up on the next app load.

type RemoteArtContextValue = {
  artFor: (slug: string) => ImageSourcePropType;
  hasArt: (slug: string) => boolean;
  // Every slug with finished art (remote ∪ bundled), for the Gallery
  castSlugs: string[];
};

const RemoteArtContext = createContext<RemoteArtContextValue | null>(null);

export function RemoteArtProvider({ children }: { children: ReactNode }) {
  const [remote, setRemote] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from('characters').list('', { limit: 1000 });
      if (cancelled || error || !data) return; // offline etc. -> bundled art still works
      const map = new Map<string, string>();
      for (const obj of data) {
        if (!obj.name.endsWith('.png')) continue;
        const slug = slugFromAssetName(obj.name);
        const { data: pub } = supabase.storage.from('characters').getPublicUrl(obj.name);
        const version = encodeURIComponent(obj.updated_at ?? '');
        map.set(slug, `${pub.publicUrl}?v=${version}`);
      }
      setRemote(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<RemoteArtContextValue>(
    () => ({
      artFor: (slug) => {
        const uri = remote.get(slug);
        return uri ? { uri } : characterArtFor(slug);
      },
      hasArt: (slug) => remote.has(slug) || CHARACTER_SLUGS.includes(slug),
      castSlugs: [...new Set([...remote.keys(), ...CHARACTER_SLUGS])],
    }),
    [remote]
  );

  return <RemoteArtContext.Provider value={value}>{children}</RemoteArtContext.Provider>;
}

export function useCharacterArt(): RemoteArtContextValue {
  const ctx = useContext(RemoteArtContext);
  if (!ctx) throw new Error('useCharacterArt must be used within a RemoteArtProvider');
  return ctx;
}
