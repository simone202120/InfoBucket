/**
 * Logica di autenticazione dell'app (single-user, Supabase Auth email/password).
 *
 * Espone una sola fonte di verità per la sessione corrente tramite `useAuth()`.
 * Usa esclusivamente il client `supabase` (anon key + auth utente): nessun
 * segreto vive qui e nessun dettaglio sensibile finisce nei log o negli errori
 * mostrati. Gli errori di Supabase sono mappati in messaggi leggibili in italiano.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/** Stato della sessione. Parte da 'loading' finché non si recupera quella persistita. */
export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

/** Esito di un'operazione di auth: `error` è null in caso di successo. */
export interface AuthActionResult {
  error: string | null;
}

/** API pubblica esposta da `useAuth()`. */
export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  status: AuthStatus;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Traduce un errore di Supabase Auth in un messaggio per l'utente, senza esporre
 * dettagli interni. La mappatura usa i codici/messaggi più comuni; il fallback è
 * un messaggio generico.
 */
function toReadableError(error: AuthError): string {
  const code = error.code ?? '';
  const message = error.message.toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Email o password non corretti.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Conferma la tua email prima di accedere.';
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Esiste già un account con questa email.';
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'La password è troppo debole.';
  }
  if (code === 'validation_failed' || message.includes('unable to validate email')) {
    return 'Inserisci un indirizzo email valido.';
  }
  if (code === 'over_request_rate_limit' || message.includes('rate limit')) {
    return 'Troppi tentativi. Riprova tra qualche minuto.';
  }
  return 'Si è verificato un errore. Riprova.';
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Evita aggiornamenti di stato dopo l'unmount (la getSession iniziale è async).
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Sottoscrivi prima del recupero iniziale così non si perdono eventi emessi
    // durante la getSession. onAuthStateChange copre login, logout e refresh token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mountedRef.current) return;
        if (error) {
          // La sessione persistita non è leggibile: trattiamo come disconnesso.
          setSession(null);
          setStatus('signedOut');
          return;
        }
        setSession(data.session);
        setStatus(data.session ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setSession(null);
        setStatus('signedOut');
      });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback<AuthContextValue['signInWithPassword']>(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? toReadableError(error) : null };
    },
    [],
  );

  const signUpWithPassword = useCallback<AuthContextValue['signUpWithPassword']>(
    async (email, password) => {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ? toReadableError(error) : null };
    },
    [],
  );

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    // L'onAuthStateChange aggiorna lo stato; ignoriamo eventuali errori di rete
    // sul logout perché la sessione locale viene comunque invalidata dal client.
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [session, status, signInWithPassword, signUpWithPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Accede al contesto di autenticazione. Deve stare sotto `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro un <AuthProvider>.');
  }
  return context;
}
