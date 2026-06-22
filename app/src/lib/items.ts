/**
 * Accesso ai dati degli `items` — unico punto che parla con la tabella `items`.
 * Le schermate non costruiscono query: usano queste funzioni e i tipi di dominio.
 * La RLS garantisce che si vedano/scrivano solo le proprie righe; `user_id` è
 * popolato dal default `auth.uid()` lato DB, quindi non va passato dal client.
 */
import { supabase } from './supabase';
import { toItem, type ItemRow } from './mappers';
import { detectSourceType, isValidHttpUrl } from './source';
import type { Item } from '../types/domain';

/** Stati che compaiono in Inbox (non confermati): in lavorazione o pronti. */
const INBOX_STATUSES = ['processing', 'ready'] as const;

/** Errore di dominio del data layer, con messaggio adatto all'utente. */
export class ItemsError extends Error {}

/** Elementi attualmente in Inbox, dal più recente. */
export async function listInbox(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .in('status', INBOX_STATUSES as unknown as string[])
    .order('created_at', { ascending: false });

  if (error) throw new ItemsError('Impossibile caricare la Inbox.');
  return (data as ItemRow[]).map(toItem);
}

export interface AddItemInput {
  url: string;
  note?: string | null;
}

/**
 * Aggiunge un elemento incollando un URL (cattura manuale, spec §16 Fase 1).
 * Scrive una riga `processing`: il server farà il resto. Il `source_type` è una
 * stima per l'anteprima immediata; `dispatch` lo confermerà in Fase 2.
 */
export async function addItemByUrl({ url, note }: AddItemInput): Promise<Item> {
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    throw new ItemsError('Inserisci un link valido (http o https).');
  }

  const cleanNote = note?.trim() || null;
  const { data, error } = await supabase
    .from('items')
    .insert({
      source_url: trimmed,
      source_type: detectSourceType(trimmed),
      note: cleanNote,
      status: 'processing',
    })
    .select('*')
    .single();

  if (error || !data) throw new ItemsError('Impossibile salvare il link.');
  return toItem(data as ItemRow);
}
