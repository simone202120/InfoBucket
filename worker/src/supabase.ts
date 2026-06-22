/**
 * Client Supabase del worker, con service role.
 *
 * Il worker scrive sulla pipeline (media_stage, raw_content, error) con la
 * service role: bypassa RLS, quindi vive SOLO lato server (vedi §3, §14).
 * Nessuna sessione persistente / auto-refresh: è un processo headless.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from './env.ts';

export function createSupabase(env: WorkerEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
