/**
 * Raggruppa gli item della Inbox in "in scadenza" e "recenti", per dare ritmo
 * alla lista e mettere in evidenza ciò che sta per decadere. Funzione pura.
 */
import { isExpiring } from '@/lib/lifecycle';
import type { Item } from '@/types/domain';

export interface InboxGroups {
  expiring: Item[];
  recent: Item[];
}

export function groupInbox(items: Item[], now: number = Date.now()): InboxGroups {
  const expiring: Item[] = [];
  const recent: Item[] = [];
  for (const item of items) {
    if (item.status !== 'processing' && isExpiring(item, now)) expiring.push(item);
    else recent.push(item);
  }
  return { expiring, recent };
}
