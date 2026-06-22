/**
 * Client Supabase del lato app. Usa SOLO la anon key + l'auth dell'utente:
 * le RLS proteggono i dati. Le scritture di pipeline avvengono lato server
 * (Edge Functions / worker) con la service role, mai da qui.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
