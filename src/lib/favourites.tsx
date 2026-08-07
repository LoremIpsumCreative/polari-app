import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

type FavouritesContextValue = {
  // word ids the current user has favourited
  favouriteWordIds: Set<string>;
  isFavourite: (wordId: string) => boolean;
  toggleFavourite: (wordId: string) => Promise<void>;
  loading: boolean;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [favouriteWordIds, setFavouriteWordIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setFavouriteWordIds(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('favourites')
      .select('word_id')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setFavouriteWordIds(new Set(data.map((f) => f.word_id)));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavourite = useCallback(
    async (wordId: string) => {
      if (!userId) return;
      const isCurrentlyFavourite = favouriteWordIds.has(wordId);

      // Optimistic update; reverted if the write fails
      setFavouriteWordIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFavourite) next.delete(wordId);
        else next.add(wordId);
        return next;
      });

      const { error } = isCurrentlyFavourite
        ? await supabase.from('favourites').delete().eq('word_id', wordId).eq('user_id', userId)
        : await supabase.from('favourites').insert({ user_id: userId, word_id: wordId });

      if (error) {
        setFavouriteWordIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFavourite) next.add(wordId);
          else next.delete(wordId);
          return next;
        });
      }
    },
    [userId, favouriteWordIds],
  );

  const value = useMemo<FavouritesContextValue>(
    () => ({
      favouriteWordIds,
      isFavourite: (wordId) => favouriteWordIds.has(wordId),
      toggleFavourite,
      loading,
    }),
    [favouriteWordIds, toggleFavourite, loading],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within a FavouritesProvider');
  return ctx;
}
