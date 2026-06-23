/**
 * Accesso ai dati dei `buckets` (collezioni dell'utente). Le `description`
 * guidano il matching dell'AI, quindi l'utente è incoraggiato a compilarle (§8).
 *
 * Invariante (migration 0006): un bucket per nome (case-insensitive) per utente.
 * Per questo `createBucket` è un *find-or-create*: non duplica mai un nome esistente.
 */
import { supabase } from './supabase';
import {
  toBucket,
  toBucketOverview,
  type BucketOverviewRow,
  type BucketRow,
} from './mappers';
import type { Bucket, BucketOverview } from '../types/domain';

export class BucketsError extends Error {}

/** Tutti i bucket, in ordine alfabetico. */
export async function listBuckets(): Promise<Bucket[]> {
  const { data, error } = await supabase.from('buckets').select('*').order('name', { ascending: true });
  if (error) throw new BucketsError('Impossibile caricare i bucket.');
  return (data as BucketRow[]).map(toBucket);
}

/**
 * Bucket con statistiche (conteggio item + fonti), per la Libreria. Legge la vista
 * `bucket_overview` (RLS-safe, security_invoker).
 */
export async function listBucketOverviews(): Promise<BucketOverview[]> {
  const { data, error } = await supabase
    .from('bucket_overview')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new BucketsError('Impossibile caricare i bucket.');
  return (data as BucketOverviewRow[]).map(toBucketOverview);
}

/** Cerca un bucket per nome (case-insensitive, corrispondenza esatta). */
export async function findBucketByName(name: string): Promise<Bucket | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data, error } = await supabase
    .from('buckets')
    .select('*')
    .ilike('name', clean)
    .limit(1)
    .maybeSingle();
  if (error) throw new BucketsError('Impossibile cercare il bucket.');
  return data ? toBucket(data as BucketRow) : null;
}

export interface CreateBucketInput {
  name: string;
  description?: string | null;
}

/**
 * Find-or-create: se esiste già un bucket con lo stesso nome (case-insensitive) lo
 * riusa, altrimenti lo crea. Evita i duplicati (un bucket per concetto, §8).
 * `user_id` è impostato dal default `auth.uid()` lato DB.
 */
export async function createBucket({ name, description }: CreateBucketInput): Promise<Bucket> {
  const cleanName = name.trim();
  if (!cleanName) throw new BucketsError('Dai un nome al bucket.');

  const existing = await findBucketByName(cleanName);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('buckets')
    .insert({ name: cleanName, description: description?.trim() || null })
    .select('*')
    .single();
  if (error || !data) throw new BucketsError('Impossibile creare il bucket.');
  return toBucket(data as BucketRow);
}

export interface UpdateBucketInput {
  name?: string;
  description?: string | null;
}

/** Rinomina / aggiorna la descrizione di un bucket (gestione in Impostazioni). */
export async function updateBucket(id: string, fields: UpdateBucketInput): Promise<Bucket> {
  const patch: Record<string, unknown> = {};
  if (fields.name !== undefined) {
    const cleanName = fields.name.trim();
    if (!cleanName) throw new BucketsError('Dai un nome al bucket.');
    patch.name = cleanName;
  }
  if (fields.description !== undefined) patch.description = fields.description?.trim() || null;

  const { data, error } = await supabase.from('buckets').update(patch).eq('id', id).select('*').single();
  if (error || !data) throw new BucketsError('Impossibile aggiornare il bucket.');
  return toBucket(data as BucketRow);
}

/**
 * Elimina un bucket. Gli item che vi erano salvati restano (il loro `bucket_id`
 * diventa null per il vincolo `on delete set null`): nessun dato dell'utente sparisce.
 */
export async function deleteBucket(id: string): Promise<void> {
  const { error } = await supabase.from('buckets').delete().eq('id', id);
  if (error) throw new BucketsError('Impossibile eliminare il bucket.');
}
