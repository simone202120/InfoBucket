/**
 * Gestione dei bucket dalla schermata Impostazioni: caricamento, rinomina ed
 * eliminazione con stato esplicito (loading/error). La logica vive qui, isolata
 * dalla UI: le mutazioni delegano a `@/lib/buckets` e poi ricaricano la lista,
 * così la schermata mostra sempre conteggi e nomi aggiornati.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteBucket, listBucketOverviews, updateBucket } from '@/lib/buckets';
import type { BucketOverview } from '@/types/domain';

export interface BucketAdminState {
  buckets: BucketOverview[];
  loading: boolean;
  error: string | null;
  /** Ricarica la lista dei bucket. */
  refetch: () => Promise<void>;
  /** Rinomina un bucket e aggiorna la lista. Ritorna true se è andata a buon fine. */
  rename: (id: string, name: string) => Promise<boolean>;
  /** Elimina un bucket e aggiorna la lista. Ritorna true se è andata a buon fine. */
  remove: (id: string) => Promise<boolean>;
}

export function useBucketAdmin(): BucketAdminState {
  const [buckets, setBuckets] = useState<BucketOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBucketOverviews();
      if (mounted.current) setBuckets(data);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const rename = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setError(null);
      try {
        await updateBucket(id, { name });
        await load();
        return true;
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
        return false;
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await deleteBucket(id);
        await load();
        return true;
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Errore imprevisto.');
        return false;
      }
    },
    [load],
  );

  return { buckets, loading, error, refetch: load, rename, remove };
}
