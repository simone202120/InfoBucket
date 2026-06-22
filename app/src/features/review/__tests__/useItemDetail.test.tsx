import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useItemDetail } from '../useItemDetail';
import { confirmItem, deleteItem, getItem, regenerate, updateItem } from '@/lib/items';
import { createBucket, listBuckets } from '@/lib/buckets';
import type { Bucket, Item } from '@/types/domain';

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
const updateItemMock = updateItem as jest.Mock;
const confirmItemMock = confirmItem as jest.Mock;
const deleteItemMock = deleteItem as jest.Mock;
const regenerateMock = regenerate as jest.Mock;
const listBucketsMock = listBuckets as jest.Mock;
const createBucketMock = createBucket as jest.Mock;

const item = (over: Partial<Item> = {}): Item => ({
  id: 'i1',
  sourceUrl: 'https://a.com',
  sourceType: 'article',
  storagePath: null,
  fileType: null,
  rawContent: null,
  note: null,
  summary: 'Riassunto',
  tags: ['a'],
  suggestedBucketId: null,
  suggestedBucketName: 'Cucina',
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

const bucket = (id: string, name: string): Bucket => ({ id, name, description: null, createdAt: '2026-06-22T12:00:00Z' });

beforeEach(() => {
  getItemMock.mockReset();
  updateItemMock.mockReset();
  confirmItemMock.mockReset();
  deleteItemMock.mockReset();
  regenerateMock.mockReset();
  listBucketsMock.mockReset();
  createBucketMock.mockReset();
});

it('carica item e bucket al mount', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina')]);

  const { result } = renderHook(() => useItemDetail('i1'));

  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.item?.id).toBe('i1');
  expect(result.current.buckets).toHaveLength(1);
  expect(result.current.error).toBeNull();
});

it('save chiama updateItem e aggiorna l\'item', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([]);
  updateItemMock.mockResolvedValue(item({ summary: 'Nuovo' }));

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  let ok = false;
  await act(async () => {
    ok = await result.current.save({ summary: 'Nuovo', tags: ['a'], note: null });
  });

  expect(ok).toBe(true);
  expect(updateItemMock).toHaveBeenCalledWith('i1', { summary: 'Nuovo', tags: ['a'], note: null });
  expect(result.current.item?.summary).toBe('Nuovo');
});

it('confirm su bucket esistente chiama confirmItem senza creare bucket', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([bucket('b1', 'Cucina')]);
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b1' }));

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => {
    await result.current.confirm({ kind: 'existing', bucketId: 'b1' });
  });

  expect(createBucketMock).not.toHaveBeenCalled();
  expect(confirmItemMock).toHaveBeenCalledWith('i1', 'b1');
  expect(result.current.item?.status).toBe('saved');
});

it('confirm su bucket nuovo crea il bucket poi conferma', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([]);
  createBucketMock.mockResolvedValue(bucket('b2', 'Viaggi'));
  confirmItemMock.mockResolvedValue(item({ status: 'saved', bucketId: 'b2' }));

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => {
    await result.current.confirm({ kind: 'new', name: 'Viaggi', description: 'Posti' });
  });

  expect(createBucketMock).toHaveBeenCalledWith({ name: 'Viaggi', description: 'Posti' });
  expect(confirmItemMock).toHaveBeenCalledWith('i1', 'b2');
  expect(result.current.item?.status).toBe('saved');
});

it('regenerateItem invoca regenerate e ricarica l\'item', async () => {
  getItemMock.mockResolvedValueOnce(item({ summary: 'Vecchio' })).mockResolvedValueOnce(item({ summary: 'Rigenerato' }));
  listBucketsMock.mockResolvedValue([]);
  regenerateMock.mockResolvedValue(undefined);

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.item?.summary).toBe('Vecchio'));

  await act(async () => {
    await result.current.regenerateItem();
  });

  expect(regenerateMock).toHaveBeenCalledWith('i1');
  expect(getItemMock).toHaveBeenCalledTimes(2);
  expect(result.current.item?.summary).toBe('Rigenerato');
});

it('remove chiama deleteItem e ritorna true', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([]);
  deleteItemMock.mockResolvedValue(undefined);

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  let ok = false;
  await act(async () => {
    ok = await result.current.remove();
  });

  expect(ok).toBe(true);
  expect(deleteItemMock).toHaveBeenCalledWith('i1');
});

it('espone un messaggio di errore se il caricamento fallisce', async () => {
  getItemMock.mockRejectedValue(new Error('Elemento non trovato.'));
  listBucketsMock.mockResolvedValue([]);

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.item).toBeNull();
  expect(result.current.error).toBe('Elemento non trovato.');
});

it('save propaga l\'errore e ritorna false', async () => {
  getItemMock.mockResolvedValue(item());
  listBucketsMock.mockResolvedValue([]);
  updateItemMock.mockRejectedValue(new Error('Impossibile aggiornare.'));

  const { result } = renderHook(() => useItemDetail('i1'));
  await waitFor(() => expect(result.current.loading).toBe(false));

  let ok = true;
  await act(async () => {
    ok = await result.current.save({ summary: 'x' });
  });

  expect(ok).toBe(false);
  expect(result.current.error).toBe('Impossibile aggiornare.');
});
