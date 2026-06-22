/**
 * Accesso ai dati dei `buckets` (collezioni dell'utente). Le `description`
 * guidano il matching dell'AI, quindi l'utente è incoraggiato a compilarle (§8).
 */
import { supabase } from './supabase';
import { toBucket, type BucketRow } from './mappers';
import type { Bucket } from '../types/domain';

export class BucketsError extends Error {}

/** Tutti i bucket, in ordine alfabetico. */
export async function listBuckets(): Promise<Bucket[]> {
  const { data, error } = await supabase.from('buckets').select('*').order('name', { ascending: true });
  if (error) throw new BucketsError('Impossibile caricare i bucket.');
  return (data as BucketRow[]).map(toBucket);
}

export interface CreateBucketInput {
  name: string;
  description?: string | null;
}

/** Crea un nuovo bucket. `user_id` è impostato dal default `auth.uid()` lato DB. */
export async function createBucket({ name, description }: CreateBucketInput): Promise<Bucket> {
  const cleanName = name.trim();
  if (!cleanName) throw new BucketsError('Dai un nome al bucket.');

  const { data, error } = await supabase
    .from('buckets')
    .insert({ name: cleanName, description: description?.trim() || null })
    .select('*')
    .single();
  if (error || !data) throw new BucketsError('Impossibile creare il bucket.');
  return toBucket(data as BucketRow);
}
