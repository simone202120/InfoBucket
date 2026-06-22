/**
 * Logica del ciclo di vita lato client (solo presentazione: countdown e soglie).
 * La decadenza autorevole avviene su pg_cron lato server (infobucket-spec.md §10).
 */
import type { Item } from '../types/domain';

/** Giorni in inbox (ready) prima del passaggio in archivio. */
export const DAYS_TO_ARCHIVE = 7;
/** Giorni in archivio prima della cancellazione definitiva. */
export const DAYS_TO_DELETE = 20;

const MS_PER_DAY = 86_400_000;

function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / MS_PER_DAY);
}

/**
 * Giorni rimanenti prima della prossima transizione di decadenza, o null se
 * l'elemento non decade (saved) o lo stato non si applica. Mai negativo.
 */
export function daysLeft(item: Pick<Item, 'status' | 'createdAt' | 'archivedAt'>, now: number = Date.now()): number | null {
  if (item.status === 'ready') {
    return Math.max(0, DAYS_TO_ARCHIVE - daysSince(item.createdAt, now));
  }
  if (item.status === 'archived' && item.archivedAt) {
    return Math.max(0, DAYS_TO_DELETE - daysSince(item.archivedAt, now));
  }
  return null;
}

/** True se l'elemento è prossimo alla scadenza (≤2 giorni) — guida il badge ambra. */
export function isExpiring(item: Pick<Item, 'status' | 'createdAt' | 'archivedAt'>, now: number = Date.now()): boolean {
  const left = daysLeft(item, now);
  return left !== null && left <= 2;
}
