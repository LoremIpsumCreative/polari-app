import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Collection } from '../types/database';

export type CollectionWithWords = Collection & { wordIds: string[] };

type CollectionsContextValue = {
  collections: CollectionWithWords[];
  bySlug: Map<string, CollectionWithWords>;
  loading: boolean;
};

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

// Themed collections are a handful of small, public rows — fetch once and share,
// resolving membership to word ids that screens hydrate from the words cache.
export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionWithWords[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cols }, { data: members }] = await Promise.all([
        supabase.from('collections').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('collection_words')
          .select('collection_id, word_id, sort_order')
          .order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;

      const wordIdsByCollection = new Map<string, string[]>();
      for (const m of members ?? []) {
        const list = wordIdsByCollection.get(m.collection_id) ?? [];
        list.push(m.word_id);
        wordIdsByCollection.set(m.collection_id, list);
      }
      setCollections(
        (cols ?? []).map((c) => ({ ...c, wordIds: wordIdsByCollection.get(c.id) ?? [] })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
      bySlug: new Map(collections.map((c) => [c.slug, c])),
      loading,
    }),
    [collections, loading],
  );

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>;
}

export function useCollections(): CollectionsContextValue {
  const ctx = useContext(CollectionsContext);
  if (!ctx) throw new Error('useCollections must be used within a CollectionsProvider');
  return ctx;
}
