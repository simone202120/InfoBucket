// cors.ts — Helper CORS condiviso fra le Edge Functions.

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Risposta da usare per le preflight OPTIONS. */
export function preflightResponse(): Response {
  return new Response("ok", { headers: corsHeaders });
}

/** Costruisce una Response JSON con gli header CORS. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Risposta d'errore che NON espone dettagli interni (spec: gestisci gli errori
 * senza esporre dettagli). Logga internamente il dettaglio, espone solo `message`.
 */
export function errorResponse(message: string, status = 500, detail?: unknown): Response {
  if (detail !== undefined) console.error(message, detail);
  return jsonResponse({ error: message }, status);
}
