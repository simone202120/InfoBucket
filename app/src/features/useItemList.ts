/**
 * Hook generico per una lista di item con stato esplicito e refresh.
 * Riusato da Inbox e Archivio (e da future liste): la sola differenza è il loader.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item } from '@/types/domain';

export interface ItemListState {
  items: Item[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useItemList(load: () => Promise<Item[]>): ItemListState {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const run = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (mounted.current) setItems(data);
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [load],
  );

  useEffect(() => {
    mounted.current = true;
    void run(false);
    return () => {
      mounted.current = false;
    };
  }, [run]);

  const refetch = useCallback(() => run(true), [run]);

  return { items, loading, refreshing, error, refetch };
}
