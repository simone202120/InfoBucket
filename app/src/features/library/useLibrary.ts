/**
 * Stato della Libreria: i bucket dell'utente con le statistiche per la card
 * (conteggio + fonti). Carica da `listBucketOverviews` al mount, con refresh
 * esplicito (pull-to-refresh, dopo la creazione di un bucket). Specchio di
 * `useInbox`/`useArchive`, ma sui bucket invece che sugli item.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listBucketOverviews } from '@/lib/buckets';
import type { BucketOverview } from '@/types/domain';

export interface LibraryState {
  buckets: BucketOverview[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLibrary(): LibraryState {
  const [buckets, setBuckets] = useState<BucketOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const run = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listBucketOverviews();
      if (mounted.current) setBuckets(data);
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
    void run(false);
    return () => {
      mounted.current = false;
    };
  }, [run]);

  const refetch = useCallback(() => run(true), [run]);

  return { buckets, loading, refreshing, error, refetch };
}
