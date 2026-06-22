/**
 * Stato della schermata di dettaglio/review (spec §9). Carica l'item e i bucket,
 * e offre le azioni della review: salva le modifiche (nota/riassunto/tag),
 * rigenera (e ricarica), conferma in un bucket (esistente o nuovo da creare),
 * elimina. Lo stato è esplicito (loading/saving/error) come in `useInbox`.
 * Tutta la logica di accesso ai dati vive in `@/lib/items` e `@/lib/buckets`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createBucket, listBuckets } from '@/lib/buckets';
import { confirmItem, deleteItem, getItem, regenerate, updateItem } from '@/lib/items';
import type { Bucket, Item } from '@/types/domain';

/** Campi modificabili in review. */
export interface ItemEdits {
  note?: string | null;
  summary?: string | null;
  tags?: string[];
}

/** Bersaglio di una conferma: un bucket esistente o uno nuovo da creare. */
export type ConfirmTarget =
  | { kind: 'existing'; bucketId: string }
  | { kind: 'new'; name: string; description?: string | null };

export interface ItemDetailState {
  item: Item | null;
  buckets: Bucket[];
  loading: boolean;
  saving: boolean;
  regenerating: boolean;
  confirming: boolean;
  error: string | null;
  /** Salva le modifiche ai campi editabili e aggiorna l'item locale. */
  save: (edits: ItemEdits) => Promise<boolean>;
  /** Ri-elabora tenendo conto della nota aggiornata, poi ricarica l'item. */
  regenerateItem: () => Promise<boolean>;
  /** Conferma l'item in un bucket esistente o creandone uno nuovo. */
  confirm: (target: ConfirmTarget) => Promise<boolean>;
  /** Elimina l'item in modo permanente. */
  remove: () => Promise<boolean>;
}

const GENERIC_ERROR = 'Errore imprevisto.';

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : GENERIC_ERROR;
}

export function useItemDetail(id: string): ItemDetailState {
  const [item, setItem] = useState<Item | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // L'item e i bucket sono indipendenti: caricali in parallelo.
      const [loadedItem, loadedBuckets] = await Promise.all([getItem(id), listBuckets()]);
      if (mounted.current) {
        setItem(loadedItem);
        setBuckets(loadedBuckets);
      }
    } catch (e) {
      if (mounted.current) setError(messageOf(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const save = useCallback(
    async (edits: ItemEdits): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateItem(id, edits);
        if (mounted.current) setItem(updated);
        return true;
      } catch (e) {
        if (mounted.current) setError(messageOf(e));
        return false;
      } finally {
        if (mounted.current) setSaving(false);
      }
    },
    [id],
  );

  const regenerateItem = useCallback(async (): Promise<boolean> => {
    setRegenerating(true);
    setError(null);
    try {
      await regenerate(id);
      // La rigenerazione riusa il raw_content lato server: ricarica l'item aggiornato.
      const reloaded = await getItem(id);
      if (mounted.current) setItem(reloaded);
      return true;
    } catch (e) {
      if (mounted.current) setError(messageOf(e));
      return false;
    } finally {
      if (mounted.current) setRegenerating(false);
    }
  }, [id]);

  const confirm = useCallback(
    async (target: ConfirmTarget): Promise<boolean> => {
      setConfirming(true);
      setError(null);
      try {
        // Bucket nuovo: crealo prima, poi conferma sull'id appena creato (spec §8).
        const bucketId =
          target.kind === 'existing'
            ? target.bucketId
            : (await createBucket({ name: target.name, description: target.description })).id;
        const confirmed = await confirmItem(id, bucketId);
        if (mounted.current) setItem(confirmed);
        return true;
      } catch (e) {
        if (mounted.current) setError(messageOf(e));
        return false;
      } finally {
        if (mounted.current) setConfirming(false);
      }
    },
    [id],
  );

  const remove = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await deleteItem(id);
      return true;
    } catch (e) {
      if (mounted.current) setError(messageOf(e));
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [id]);

  return {
    item,
    buckets,
    loading,
    saving,
    regenerating,
    confirming,
    error,
    save,
    regenerateItem,
    confirm,
    remove,
  };
}
