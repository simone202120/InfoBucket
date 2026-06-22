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

/** Singolo elemento per la schermata di dettaglio/review. */
export async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
  if (error || !data) throw new ItemsError('Elemento non trovato.');
  return toItem(data as ItemRow);
}

/** Aggiorna i campi modificabili in review (nota, riassunto, tag). */
export async function updateItem(
  id: string,
  fields: Partial<Pick<Item, 'note' | 'summary' | 'tags'>>,
): Promise<Item> {
  const patch: Record<string, unknown> = {};
  if (fields.note !== undefined) patch.note = fields.note?.trim() || null;
  if (fields.summary !== undefined) patch.summary = fields.summary?.trim() || null;
  if (fields.tags !== undefined) patch.tags = fields.tags;

  const { data, error } = await supabase.from('items').update(patch).eq('id', id).select('*').single();
  if (error || !data) throw new ItemsError('Impossibile aggiornare l\'elemento.');
  return toItem(data as ItemRow);
}

/**
 * Conferma un elemento in un bucket: diventa permanente (`saved`).
 * Il gesto che "salva" definitivamente (spec §8, §9).
 */
export async function confirmItem(id: string, bucketId: string): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ bucket_id: bucketId, status: 'saved', confirmed_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new ItemsError('Impossibile salvare nel bucket.');
  return toItem(data as ItemRow);
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw new ItemsError('Impossibile eliminare l\'elemento.');
}

/**
 * Rigenera summary/tag/bucket riusando il `raw_content` già salvato + la nota
 * aggiornata (spec §6.3). Invoca la Edge Function `generate` lato server; nessun
 * nuovo download. Il client ricarica l'item al termine.
 */
export async function regenerate(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke('generate', { body: { item_id: id } });
  if (error) throw new ItemsError('Rigenerazione non riuscita.');
}

/**
 * Ricerca ibrida (semantica + keyword) tra gli elementi salvati/archiviati
 * (spec §11). L'embedding della query e la fusione avvengono lato server nella
 * Edge Function `search`; qui mappiamo solo i risultati.
 */
export async function searchItems(query: string): Promise<Item[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase.functions.invoke('search', { body: { q } });
  if (error) throw new ItemsError('Ricerca non riuscita.');
  const rows = (data as { items?: ItemRow[] } | null)?.items ?? [];
  return rows.map(toItem);
}
