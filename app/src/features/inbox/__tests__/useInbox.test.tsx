import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useInbox } from '../useInbox';
import { listInbox } from '@/lib/items';
import type { Item } from '@/types/domain';

jest.mock('@/lib/items', () => ({ listInbox: jest.fn() }));
const listInboxMock = listInbox as jest.Mock;

const item = (id: string): Item => ({
  id,
  sourceUrl: 'https://a.com',
  sourceType: 'article',
  storagePath: null,
  fileType: null,
  rawContent: null,
  note: null,
  summary: null,
  tags: [],
  suggestedBucketId: null,
  suggestedBucketName: null,
  bucketId: null,
  status: 'ready',
  mediaStage: 'not_needed',
  error: null,
  createdAt: '2026-06-22T12:00:00Z',
  processedAt: null,
  confirmedAt: null,
  archivedAt: null,
});

beforeEach(() => listInboxMock.mockReset());

it('carica gli item al mount e termina il loading', async () => {
  listInboxMock.mockResolvedValue([item('a')]);
  const { result } = renderHook(() => useInbox());

  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toHaveLength(1);
  expect(result.current.error).toBeNull();
});

it('espone un messaggio di errore se il caricamento fallisce', async () => {
  listInboxMock.mockRejectedValue(new Error('Impossibile caricare la Inbox.'));
  const { result } = renderHook(() => useInbox());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Impossibile caricare la Inbox.');
});

it('refetch ricarica i dati', async () => {
  listInboxMock.mockResolvedValueOnce([item('a')]).mockResolvedValueOnce([item('a'), item('b')]);
  const { result } = renderHook(() => useInbox());
  await waitFor(() => expect(result.current.items).toHaveLength(1));

  await act(async () => {
    await result.current.refetch();
  });
  expect(result.current.items).toHaveLength(2);
});
