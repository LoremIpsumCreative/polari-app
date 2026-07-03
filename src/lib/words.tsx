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
import type { Word } from '../types/database';

type WordsContextValue = {
  words: Word[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  bySlug: Map<string, Word>;
};

const WordsContext = createContext<WordsContextValue | null>(null);

// The whole dictionary is ~293 rows, so fetch it once per session and share it:
// dictionary browsing, search, word-of-the-day, and quiz generation all read from
// this cache instead of hitting Supabase separately.
export function WordsProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('words')
      .select('*')
      .order('sort_order', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setWords(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const value = useMemo<WordsContextValue>(
    () => ({
      words,
      loading,
      error,
      refetch: fetchWords,
      bySlug: new Map(words.map((w) => [w.slug, w])),
    }),
    [words, loading, error, fetchWords]
  );

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords(): WordsContextValue {
  const ctx = useContext(WordsContext);
  if (!ctx) throw new Error('useWords must be used within a WordsProvider');
  return ctx;
}
