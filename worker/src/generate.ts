/**
 * Innesco della Edge Function `generate` dopo l'estrazione media (§7.6/§7.7).
 *
 * `generate` è il cuore AI condiviso (OpenRouter + embedding): il worker NON
 * genera nulla, si limita a passare il testimone. Va chiamata SIA in caso di
 * successo SIA in caso di errore di estrazione: caption + nota possono bastare
 * per un riassunto utile (§7.7).
 *
 * Autenticazione: la function gira come endpoint Supabase; chiamandola
 * server-to-server usiamo la service role come Bearer (il worker è già fidato,
 * non passa da RLS/auth utente). La function legge l'item da `item_id`.
 */
import type { WorkerEnv } from './env.ts';

/** URL della Edge Function `generate` per un dato progetto Supabase. */
export function generateFunctionUrl(supabaseUrl: string): string {
  // I progetti Supabase espongono le functions su <project>/functions/v1/<name>.
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/generate`;
}

export interface InvokeGenerateResult {
  ok: boolean;
  status: number;
}

/**
 * Invoca `generate` per un item. Idempotente lato server (rigenera dallo stato
 * corrente di `raw_content`), quindi è sicuro ritentare. Non lancia: restituisce
 * l'esito così che il loop possa proseguire con l'item successivo anche se la
 * function risponde male (l'item resta comunque visibile in inbox).
 */
export async function invokeGenerate(
  itemId: string,
  env: WorkerEnv,
): Promise<InvokeGenerateResult> {
  const url = generateFunctionUrl(env.supabaseUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      apikey: env.supabaseServiceRoleKey,
    },
    body: JSON.stringify({ item_id: itemId }),
  });
  // Non leggiamo/loggiamo il corpo: può contenere dettagli interni.
  return { ok: res.ok, status: res.status };
}
