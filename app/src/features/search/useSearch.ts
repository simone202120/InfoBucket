/**
 * Stato della ricerca: query corrente, risultati e stato esplicito. La ricerca
 * parte all'invio (non a ogni tasto) per non sprecare chiamate di embedding.
 */
import { useCallback, useRef, useState } from 'react';
import { searchItems } from '@/lib/items';
import type { Item } from '@/types/domain';

export interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  results: Item[];
  loading: boolean;
  error: string | null;
  /** True dopo almeno una ricerca eseguita (per distinguere "vuoto" da "iniziale"). */
  searched: boolean;
  run: () => Promise<void>;
}

export function useSearch(): SearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  // Ignora le risposte di ricerche superate (l'ultima query vince).
  const seq = useRef(0);

  const run = useCallback(async () => {
    const q = query.trim();
    const current = ++seq.current;
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await searchItems(q);
      if (current === seq.current) {
        setResults(items);
        setSearched(true);
      }
    } catch (e) {
      if (current === seq.current) setError(e instanceof Error ? e.message : 'Ricerca non riuscita.');
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, [query]);

  return { query, setQuery, results, loading, error, searched, run };
}
