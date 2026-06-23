import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import SettingsScreen from '../../../../app/settings';
import { useAuth } from '@/features/auth';
import { listBucketOverviews } from '@/lib/buckets';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const signOut = jest.fn();
jest.mock('@/features/auth', () => ({ useAuth: jest.fn() }));

jest.mock('@/lib/buckets', () => ({
  listBucketOverviews: jest.fn(),
  updateBucket: jest.fn(),
  deleteBucket: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) } },
}));

const useAuthMock = useAuth as jest.Mock;
const listMock = listBucketOverviews as jest.Mock;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrap = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{<ThemeProvider>{ui}</ThemeProvider>}</SafeAreaProvider>);

beforeEach(() => {
  signOut.mockReset();
  useAuthMock.mockReturnValue({ user: { email: 'utente@example.com' }, signOut });
  listMock.mockReset();
  listMock.mockResolvedValue([
    { id: '1', name: 'Cucina', description: null, createdAt: '2026-06-01T00:00:00Z', itemCount: 2, sources: ['article'] },
  ]);
});

it('mostra le sezioni principali e l\'email dell\'utente', async () => {
  const { getByText } = wrap(<SettingsScreen />);

  expect(getByText('Impostazioni')).toBeTruthy();
  expect(getByText('Account')).toBeTruthy();
  expect(getByText('Aspetto')).toBeTruthy();
  expect(getByText('I tuoi bucket')).toBeTruthy();
  expect(getByText('Ciclo di vita')).toBeTruthy();
  expect(getByText('utente@example.com')).toBeTruthy();

  await waitFor(() => expect(getByText('Cucina')).toBeTruthy());
});

it('chiama signOut alla pressione di "Esci"', async () => {
  const { getByText } = wrap(<SettingsScreen />);
  fireEvent.press(getByText('Esci'));
  expect(signOut).toHaveBeenCalled();
  // Attende il caricamento bucket per evitare update fuori da act() dopo l'asserzione.
  await waitFor(() => expect(getByText('Cucina')).toBeTruthy());
});
