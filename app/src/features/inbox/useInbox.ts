/**
 * Stato della Inbox: gli item non confermati (processing/ready). Sottile
 * specializzazione di `useItemList` con il loader dell'inbox.
 */
import { listInbox } from '@/lib/items';
import { useItemList, type ItemListState } from '@/features/useItemList';

export type InboxState = ItemListState;

export function useInbox(): InboxState {
  return useItemList(listInbox);
}
