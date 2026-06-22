/**
 * Configurazione pubblica del client. SOLO valori non sensibili:
 * il client conosce esclusivamente URL Supabase e anon key (pubblica per design).
 * Le chiavi AI / service role NON vivono mai qui. Vedi infobucket-spec.md §14.
 *
 * Le variabili EXPO_PUBLIC_* sono iniettate da Expo in fase di build/dev.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variabile d'ambiente mancante: ${name}. Copia app/.env.example in app/.env e compilala.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
} as const;
