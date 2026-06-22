/**
 * Tipi di dominio usati dal worker. Allineati agli enum SQL (§5) e ai tipi
 * condivisi in app/src/types/domain.ts: una sola fonte di verità concettuale.
 *
 * Qui i campi seguono i nomi delle COLONNE DB (snake_case), perché il worker
 * parla direttamente con Postgres via supabase-js, senza il layer di mapping
 * camelCase del client.
 */

/** enum SQL: item_status. */
export type ItemStatus = 'processing' | 'ready' | 'saved' | 'archived';

/** enum SQL: source_type. */
export type SourceType =
  | 'article'
  | 'youtube'
  | 'reel'
  | 'tiktok'
  | 'document'
  | 'other';

/** enum SQL: media_stage (sotto-pipeline di estrazione media). */
export type MediaStage = 'not_needed' | 'pending' | 'processing' | 'done' | 'error';

/** Tipi-fonte gestiti dal worker (percorso media). */
export type MediaSourceType = Extract<SourceType, 'reel' | 'tiktok' | 'youtube'>;

/**
 * Sottoinsieme di `items` di cui il worker ha bisogno per lavorare un claim.
 * Non selezioniamo `embedding`/`fts`/campi UI per tenere il payload minimale.
 */
export interface ClaimedItem {
  id: string;
  source_url: string | null;
  source_type: SourceType;
  note: string | null;
  media_stage: MediaStage;
}

/** Metadati leggeri estratti dalla fonte (caption/autore), §7.2. */
export interface CaptionMetadata {
  /** Titolo o caption del contenuto, se disponibile. */
  caption: string | null;
  /** Handle/nome autore, se disponibile. */
  author: string | null;
}
