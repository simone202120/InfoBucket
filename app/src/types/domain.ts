/**
 * Tipi di dominio condivisi — UNICA fonte di verità lato client.
 * Devono restare allineati agli enum SQL definiti in supabase/migrations.
 * Vedi infobucket-spec.md §5.
 */

/** Ciclo di vita di un elemento (enum SQL: item_status). */
export type ItemStatus = 'processing' | 'ready' | 'saved' | 'archived';

/** Tipo di fonte (enum SQL: source_type). */
export type SourceType =
  | 'article'
  | 'youtube'
  | 'reel'
  | 'tiktok'
  | 'document'
  | 'other';

/** Sotto-pipeline di estrazione media gestita dal worker (enum SQL: media_stage). */
export type MediaStage =
  | 'not_needed'
  | 'pending'
  | 'processing'
  | 'done'
  | 'error';

/** Collezione creata dall'utente. */
export interface Bucket {
  id: string;
  name: string;
  /** Usata dall'AI per il matching: descrive cosa ci va dentro. */
  description: string | null;
  createdAt: string;
}

/** Elemento catturato. Campi camelCase; il mapping da/verso le colonne snake_case
 *  del DB vive in un solo posto (app/src/lib). */
export interface Item {
  id: string;
  sourceUrl: string | null;
  sourceType: SourceType;
  storagePath: string | null;
  fileType: string | null;
  /** Grezzo estratto, persistito per la rigenerazione. Mai buttato. */
  rawContent: string | null;
  note: string | null;
  summary: string | null;
  tags: string[];
  suggestedBucketId: string | null;
  suggestedBucketName: string | null;
  bucketId: string | null;
  status: ItemStatus;
  mediaStage: MediaStage;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
  confirmedAt: string | null;
  archivedAt: string | null;
}

/** Proposta di bucket dell'AI (output di `generate`). */
export interface BucketSuggestion {
  match: 'existing' | 'new' | 'none';
  existingId: string | null;
  newName: string | null;
}
