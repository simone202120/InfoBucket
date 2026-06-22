// supabase.ts — Client Supabase con service_role per le Edge Functions.
//
// La service_role BYPASSA le RLS: le scritture di pipeline (dispatch/generate)
// agiscono su qualunque riga. Questa chiave vive SOLO lato server (secrets delle
// Edge Functions), MAI nel client (spec §3, §14).

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/** Legge una variabile d'ambiente obbligatoria; lancia se assente. */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variabile d'ambiente mancante: ${name}`);
  return value;
}

/**
 * Crea un client Supabase con la service_role key.
 * SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono iniettate automaticamente
 * nelle Edge Functions Supabase (e documentate in .env.example per il locale).
 */
export function createServiceClient(): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Crea un client che agisce NEL CONTESTO dell'utente: inoltra il suo JWT, così le
 * query rispettano le RLS e `auth.uid()` è valorizzato. Serve per operazioni
 * user-scoped lato server (es. la ricerca, che gira come l'utente). Usa la anon key.
 */
export function createUserClient(authHeader: string): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
