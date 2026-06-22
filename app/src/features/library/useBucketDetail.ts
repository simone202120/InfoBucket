/**
 * Stato del dettaglio di un bucket: i suoi elementi salvati più la testata
 * (nome/descrizione/statistiche) per l'header. Carica le due cose in parallelo;
 * la testata viene presa da `listBucketOverviews` filtrando per id (riusa la
 * vista già pronta invece di una query dedicata). Refresh esplicito disponibile.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listBucketOverviews } from '@/lib/buckets';
import { listBucketItems } from '@/lib/items';
import type { BucketOverview, Item } from '@/types/domain';

export interface BucketDetailState {
  /** Testata del bucket; null finché non è caricata o se l'id non esiste. */
  bucket: BucketOverview | null;
  items: Item[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBucketDetail(bucketId: string): BucketDetailState {
  const [bucket, setBucket] = useState<BucketOverview | null>(null);
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
        const [overviews, bucketItems] = await Promise.all([
          listBucketOverviews(),
          listBucketItems(bucketId),
        ]);
        if (mounted.current) {
          setBucket(overviews.find((b) => b.id === bucketId) ?? null);
          setItems(bucketItems);
        }
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [bucketId],
  );

  useEffect(() => {
    mounted.current = true;
    void run(false);
    return () => {
      mounted.current = false;
    };
  }, [run]);

  const refetch = useCallback(() => run(true), [run]);

  return { bucket, items, loading, refreshing, error, refetch };
}
