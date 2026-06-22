/**
 * Stato della Inbox: carica gli item non confermati e li tiene aggiornati.
 * Espone uno stato esplicito (idle/loading/error) e un `refetch` per il
 * pull-to-refresh. La logica di accesso ai dati vive in `@/lib/items`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listInbox } from '@/lib/items';
import type { Item } from '@/types/domain';

export interface InboxState {
  items: Item[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInbox(): InboxState {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listInbox();
      if (mounted.current) setItems(data);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load(false);
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const refetch = useCallback(() => load(true), [load]);

  return { items, loading, refreshing, error, refetch };
}
