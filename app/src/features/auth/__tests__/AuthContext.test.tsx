import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock del client Supabase: nessuna rete. Esponiamo i metodi auth usati dal provider.
// jest.mock è sollevato da Babel sopra gli import, quindi `supabase` è già mockato.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const mockedAuth = supabase.auth as unknown as {
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
  signInWithPassword: jest.Mock;
  signUp: jest.Mock;
  signOut: jest.Mock;
};

/** Sessione minima sufficiente per i test (forma del tipo Session). */
function makeSession(): Session {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'simolavoro202120@gmail.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-06-22T00:00:00.000Z',
    },
  } as unknown as Session;
}

function makeAuthError(message: string, code?: string): AuthError {
  return { name: 'AuthApiError', message, code, status: 400 } as unknown as AuthError;
}

const unsubscribe = jest.fn();

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: nessun listener reale, sottoscrizione con unsubscribe mockato.
  mockedAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe } },
  });
});

describe('AuthProvider / useAuth', () => {
  it('senza sessione persistita finisce in signedOut', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('con sessione persistita finisce in signedIn ed espone user', async () => {
    const session = makeSession();
    mockedAuth.getSession.mockResolvedValue({ data: { session }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.session).toEqual(session);
    expect(result.current.user).toEqual(session.user);
  });

  it('parte da loading prima di risolvere la sessione', async () => {
    let resolveSession: (value: { data: { session: Session | null }; error: null }) => void =
      () => {};
    mockedAuth.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.status).toBe('loading');

    await act(async () => {
      resolveSession({ data: { session: null }, error: null });
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
  });

  it('signInWithPassword inoltra le credenziali e ritorna null in caso di successo', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockedAuth.signInWithPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    let outcome: { error: string | null } = { error: 'init' };
    await act(async () => {
      outcome = await result.current.signInWithPassword('a@b.com', 'secret');
    });

    expect(mockedAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    });
    expect(outcome.error).toBeNull();
  });

  it('signInWithPassword mappa le credenziali errate in un messaggio leggibile', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockedAuth.signInWithPassword.mockResolvedValue({
      error: makeAuthError('Invalid login credentials', 'invalid_credentials'),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    let outcome: { error: string | null } = { error: null };
    await act(async () => {
      outcome = await result.current.signInWithPassword('a@b.com', 'wrong');
    });

    expect(outcome.error).toBe('Email o password non corretti.');
  });

  it('signUpWithPassword inoltra le credenziali e mappa account esistente', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockedAuth.signUp.mockResolvedValue({
      error: makeAuthError('User already registered', 'user_already_exists'),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    let outcome: { error: string | null } = { error: null };
    await act(async () => {
      outcome = await result.current.signUpWithPassword('a@b.com', 'secret');
    });

    expect(mockedAuth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
    expect(outcome.error).toBe('Esiste già un account con questa email.');
  });

  it('signOut, tramite onAuthStateChange, riporta lo stato a signedOut', async () => {
    const session = makeSession();
    mockedAuth.getSession.mockResolvedValue({ data: { session }, error: null });
    mockedAuth.signOut.mockResolvedValue({ error: null });

    // Catturiamo il callback registrato per simulare l'evento di logout.
    let emit: ((event: string, session: Session | null) => void) | undefined;
    mockedAuth.onAuthStateChange.mockImplementation(
      (cb: (event: string, session: Session | null) => void) => {
        emit = cb;
        return { data: { subscription: { unsubscribe } } };
      },
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));

    await act(async () => {
      await result.current.signOut();
      emit?.('SIGNED_OUT', null);
    });

    expect(mockedAuth.signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('annulla la subscription allo smontaggio', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('useAuth fuori da AuthProvider lancia un errore esplicito', () => {
    // Silenziamo l'error boundary di React per non sporcare l'output del test.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve essere usato dentro un <AuthProvider>.',
    );
    spy.mockRestore();
  });
});
