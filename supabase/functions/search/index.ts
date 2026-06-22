// search — Edge Function (spec §11). Ricerca ibrida user-scoped.
//
// Una sola chiamata dal client: qui si genera l'embedding della query (OpenAI,
// chiave SOLO lato server) e si invoca la RPC `search_items`, che fonde semantica
// + full-text lato DB (RRF). La RPC gira NEL CONTESTO dell'utente (createUserClient
// inoltra il suo JWT) così le RLS si applicano e `auth.uid()` è valorizzato.

import { embed } from "../_shared/ai.ts";
import { errorResponse, jsonResponse, preflightResponse } from "../_shared/cors.ts";
import { createUserClient, requireEnv } from "../_shared/supabase.ts";
import { readLimit, readQuery } from "./parse.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return preflightResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Non autorizzato", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Body JSON non valido", 400);
  }

  const q = readQuery(body);
  if (q === "") return jsonResponse({ items: [] }); // query vuota: nessun risultato
  const matchCount = readLimit(body);

  try {
    const vector = await embed(q, { apiKey: requireEnv("OPENAI_API_KEY") });
    const supabase = createUserClient(authHeader);
    const { data, error } = await supabase.rpc("search_items", {
      // pgvector accetta il literal testuale "[...]"; PostgREST non casterebbe un array JSON.
      query_embedding: JSON.stringify(vector),
      query_text: q,
      match_count: matchCount,
    });
    if (error) return errorResponse("Ricerca non riuscita", 500, error);
    return jsonResponse({ items: data ?? [] });
  } catch (e) {
    return errorResponse("Ricerca non riuscita", 500, e);
  }
});
