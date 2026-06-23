import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import { ReviewScreen } from '../ReviewScreen';
import { confirmItem, getItem } from '@/lib/items';
import { listBuckets } from '@/lib/buckets';
import { ThemeProvider, ToastProvider } from '@/theme';
import type { Item } from '@/types/domain';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useFocusEffect: () => undefined,
}));
jest.mock('@/lib/items', () => ({
  getItem: jest.fn(),
  updateItem: jest.fn(),
  confirmItem: jest.fn(),
  deleteItem: jest.fn(),
  regenerate: jest.fn(),
}));
jest.mock('@/lib/buckets', () => ({
  listBuckets: jest.fn(),
  createBucket: jest.fn(),
}));

const getItemMock = getItem as jest.Mock;
const confirmItemMock = confirmItem as jest.Mock;
const listBucketsMock = listBuckets as jest.Mock;

const item = (over: Partial<Item> = {}): Item => ({
  id: 'i1',
  sourceUrl: 'https://a.com',
  sourceType: 'article',
  storagePath: null,
  fileType: null,
  rawContent: null,
  note: null,
  summary: 'Un riassunto leggibile',
  tags: ['cucina'],
  suggestedBucketId: 'b1',
  suggestedBucketName: null,
  bucketId: null,
  status: 'ready',
  mediaStage: 'not_needed',
  error: null,
  createdAt: '2026-06-22T12:00:00Z',
  processedAt: null,
  confirmedAt: null,
  archivedAt: null,
  ...over,
});

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrap = (ui: ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockBack.mockReset();
  getItemMock.mockReset();
  confirmItemMock.mockReset();
  listBucketsMock.mockReset();
});

it('mostra il riassunto e i tag dell\'elemento', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([{ id: 'b1', name: 'Cucina', description: null, createdAt: '2026-06-22T12:00:00Z' }]);

  const { getByDisplayValue, getByText } = wrap(<ReviewScreen id="i1" />);

  await waitFor(() => expect(getByDisplayValue('Un riassunto leggibile')).toBeTruthy());
  expect(getByText('cucina')).toBeTruthy();
});

const bucket = (id: string, name: string) => ({
  id,
  name,
  description: null,
  createdAt: '2026-06-22T12:00:00Z',
});

it('accetta il bucket proposto dall\'AI e chiama confirmItem', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina')]);
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b1' }));

  const { getByLabelText } = wrap(<ReviewScreen id="i1" />);

  // Il bucket proposto compare una sola volta: niente doppione lista.
  await waitFor(() => expect(getByLabelText('Accept Cucina')).toBeTruthy());
  fireEvent.press(getByLabelText('Accept Cucina'));

  await waitFor(() => expect(confirmItemMock).toHaveBeenCalledWith('i1', 'b1'));
});

it('non ripete il bucket proposto nella lista "scegli"', async () => {
  getItemMock.mockResolvedValue(item({ suggestedBucketId: 'b1' }));
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina'), bucket('b2', 'Viaggi')]);

  const { getAllByLabelText, getByLabelText } = wrap(<ReviewScreen id="i1" />);

  // La proposta (Cucina) appare una sola volta; gli altri bucket restano scegliibili.
  await waitFor(() => expect(getByLabelText('Accept Cucina')).toBeTruthy());
  expect(getAllByLabelText('Accept Cucina')).toHaveLength(1);
  expect(getByLabelText('Accept Viaggi')).toBeTruthy();
});

it('toccare un bucket della lista chiama confirmItem con quel bucket', async () => {
  getItemMock.mockResolvedValue(item({ suggestedBucketId: 'b1' }));
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina'), bucket('b2', 'Viaggi')]);
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b2' }));

  const { getByLabelText } = wrap(<ReviewScreen id="i1" />);

  await waitFor(() => expect(getByLabelText('Accept Viaggi')).toBeTruthy());
  fireEvent.press(getByLabelText('Accept Viaggi'));

  await waitFor(() => expect(confirmItemMock).toHaveBeenCalledWith('i1', 'b2'));
});

it('mostra il testo guida per salvare in un bucket', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina')]);

  const { getByText } = wrap(<ReviewScreen id="i1" />);

  await waitFor(() => expect(getByText('Tocca un bucket per salvarci l\'elemento.')).toBeTruthy());
});

it('mostra un toast e torna indietro dopo la conferma in un bucket', async () => {
  getItemMock.mockResolvedValue(item({ suggestedBucketId: 'b1' }));
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina')]);
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b1' }));

  const { getByLabelText, getByText } = wrap(<ReviewScreen id="i1" />);

  await waitFor(() => expect(getByLabelText('Accept Cucina')).toBeTruthy());
  fireEvent.press(getByLabelText('Accept Cucina'));

  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(getByText('Salvato in «Cucina»')).toBeTruthy();
});
