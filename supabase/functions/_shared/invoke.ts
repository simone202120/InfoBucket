// invoke.ts — Invocazione di una Edge Function da un'altra (es. dispatch → generate).
//
// Le Edge Functions Supabase sono raggiungibili sotto `${SUPABASE_URL}/functions/v1/<name>`.
// Autentichiamo con la service_role (le funzioni hanno verify_jwt=false ma il bearer
// è comunque buona prassi e necessario se l'opzione venisse riattivata).

import { requireEnv } from "./supabase.ts";

/**
 * Invoca una Edge Function passando un body JSON. Non attende il risultato di
 * elaborazione del chiamato oltre la risposta HTTP (la pipeline è asincrona).
 * Lancia se la chiamata HTTP fallisce, così il chiamante può registrarlo.
 */
export async function invokeFunction(
  name: string,
  body: unknown,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const url = `${requireEnv("SUPABASE_URL")}/functions/v1/${name}`;
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Invocazione di ${name} fallita (HTTP ${res.status})`);
  }
}
