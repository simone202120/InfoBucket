import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import { ReviewScreen } from '../ReviewScreen';
import { confirmItem, getItem } from '@/lib/items';
import { listBuckets } from '@/lib/buckets';
import { ThemeProvider } from '@/theme';
import type { Item } from '@/types/domain';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
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
  render(<SafeAreaProvider initialMetrics={metrics}>{<ThemeProvider>{ui}</ThemeProvider>}</SafeAreaProvider>);

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

it('accetta il bucket proposto dall\'AI e chiama confirmItem', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([{ id: 'b1', name: 'Cucina', description: null, createdAt: '2026-06-22T12:00:00Z' }]);
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b1' }));

  const { getAllByLabelText } = wrap(<ReviewScreen id="i1" />);

  // "Cucina" appare sia come proposta AI sia nella lista dei bucket: prendi la prima.
  await waitFor(() => expect(getAllByLabelText('Accept Cucina').length).toBeGreaterThan(0));
  const [accept] = getAllByLabelText('Accept Cucina');
  fireEvent.press(accept);

  await waitFor(() => expect(confirmItemMock).toHaveBeenCalledWith('i1', 'b1'));
});
