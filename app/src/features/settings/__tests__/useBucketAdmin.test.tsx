import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useBucketAdmin } from '../useBucketAdmin';
import { deleteBucket, listBucketOverviews, updateBucket } from '@/lib/buckets';
import type { BucketOverview } from '@/types/domain';

jest.mock('@/lib/buckets', () => ({
  listBucketOverviews: jest.fn(),
  updateBucket: jest.fn(),
  deleteBucket: jest.fn(),
}));

const listMock = listBucketOverviews as jest.Mock;
const updateMock = updateBucket as jest.Mock;
const deleteMock = deleteBucket as jest.Mock;

const bucket = (id: string, name: string): BucketOverview => ({
  id,
  name,
  description: null,
  createdAt: '2026-06-01T12:00:00Z',
  itemCount: 2,
  sources: ['article'],
});

beforeEach(() => {
  listMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

it('carica i bucket al mount', async () => {
  listMock.mockResolvedValue([bucket('1', 'Cucina')]);
  const { result } = renderHook(() => useBucketAdmin());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(listMock).toHaveBeenCalled();
  expect(result.current.buckets).toHaveLength(1);
  expect(result.current.error).toBeNull();
});

it('espone un errore se il caricamento fallisce', async () => {
  listMock.mockRejectedValue(new Error('Impossibile caricare i bucket.'));
  const { result } = renderHook(() => useBucketAdmin());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Impossibile caricare i bucket.');
});

it('rinomina e poi ricarica la lista', async () => {
  listMock.mockResolvedValueOnce([bucket('1', 'Cucina')]);
  const { result } = renderHook(() => useBucketAdmin());
  await waitFor(() => expect(result.current.loading).toBe(false));

  updateMock.mockResolvedValue(undefined);
  listMock.mockResolvedValueOnce([bucket('1', 'Ricette')]);

  let ok = false;
  await act(async () => {
    ok = await result.current.rename('1', 'Ricette');
  });

  expect(ok).toBe(true);
  expect(updateMock).toHaveBeenCalledWith('1', { name: 'Ricette' });
  await waitFor(() => expect(result.current.buckets[0]?.name).toBe('Ricette'));
});

it('riporta false e un errore se la rinomina fallisce', async () => {
  listMock.mockResolvedValueOnce([bucket('1', 'Cucina')]);
  const { result } = renderHook(() => useBucketAdmin());
  await waitFor(() => expect(result.current.loading).toBe(false));

  updateMock.mockRejectedValue(new Error('Impossibile aggiornare il bucket.'));

  let ok = true;
  await act(async () => {
    ok = await result.current.rename('1', 'Ricette');
  });

  expect(ok).toBe(false);
  expect(result.current.error).toBe('Impossibile aggiornare il bucket.');
});

it('elimina e poi ricarica la lista', async () => {
  listMock.mockResolvedValueOnce([bucket('1', 'Cucina'), bucket('2', 'Viaggi')]);
  const { result } = renderHook(() => useBucketAdmin());
  await waitFor(() => expect(result.current.loading).toBe(false));

  deleteMock.mockResolvedValue(undefined);
  listMock.mockResolvedValueOnce([bucket('2', 'Viaggi')]);

  let ok = false;
  await act(async () => {
    ok = await result.current.remove('1');
  });

  expect(ok).toBe(true);
  expect(deleteMock).toHaveBeenCalledWith('1');
  await waitFor(() => expect(result.current.buckets).toHaveLength(1));
});
