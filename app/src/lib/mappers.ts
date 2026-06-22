/**
 * Mapping centralizzato fra le righe DB (snake_case) e i tipi di dominio (camelCase).
 * Unico punto che conosce i nomi delle colonne: le schermate usano solo i tipi di dominio.
 */
import type { Bucket, Item } from '../types/domain';

/** Forma grezza di una riga `items` come arriva da Supabase. */
export interface ItemRow {
  id: string;
  source_url: string | null;
  source_type: Item['sourceType'];
  storage_path: string | null;
  file_type: string | null;
  raw_content: string | null;
  note: string | null;
  summary: string | null;
  tags: string[] | null;
  suggested_bucket_id: string | null;
  suggested_bucket_name: string | null;
  bucket_id: string | null;
  status: Item['status'];
  media_stage: Item['mediaStage'];
  error: string | null;
  created_at: string;
  processed_at: string | null;
  confirmed_at: string | null;
  archived_at: string | null;
}

export interface BucketRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    storagePath: row.storage_path,
    fileType: row.file_type,
    rawContent: row.raw_content,
    note: row.note,
    summary: row.summary,
    tags: row.tags ?? [],
    suggestedBucketId: row.suggested_bucket_id,
    suggestedBucketName: row.suggested_bucket_name,
    bucketId: row.bucket_id,
    status: row.status,
    mediaStage: row.media_stage,
    error: row.error,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    confirmedAt: row.confirmed_at,
    archivedAt: row.archived_at,
  };
}

export function toBucket(row: BucketRow): Bucket {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}
