/**
 * Stato dell'Archivio: gli item decaduti dall'inbox, recuperabili (§10).
 * Specializzazione di `useItemList` con il loader dell'archivio.
 */
import { listArchived } from '@/lib/items';
import { useItemList, type ItemListState } from '@/features/useItemList';

export type ArchiveState = ItemListState;

export function useArchive(): ArchiveState {
  return useItemList(listArchived);
}
