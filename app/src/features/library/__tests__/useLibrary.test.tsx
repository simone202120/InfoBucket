import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLibrary } from '../useLibrary';
import { listBucketOverviews } from '@/lib/buckets';
import type { BucketOverview } from '@/types/domain';

jest.mock('@/lib/buckets', () => ({ listBucketOverviews: jest.fn() }));
const listMock = listBucketOverviews as jest.Mock;

const bucket = (id: string): BucketOverview => ({
  id,
  name: `Bucket ${id}`,
  description: null,
  createdAt: '2026-06-22T12:00:00Z',
  itemCount: 2,
  sources: ['article'],
});

beforeEach(() => listMock.mockReset());

it('carica i bucket al mount e termina il loading', async () => {
  listMock.mockResolvedValue([bucket('a')]);
  const { result } = renderHook(() => useLibrary());

  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(listMock).toHaveBeenCalled();
  expect(result.current.buckets).toHaveLength(1);
  expect(result.current.error).toBeNull();
});

it('espone un messaggio di errore se il caricamento fallisce', async () => {
  listMock.mockRejectedValue(new Error('Impossibile caricare i bucket.'));
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Impossibile caricare i bucket.');
});

it('refetch ricarica i dati', async () => {
  listMock.mockResolvedValueOnce([bucket('a')]).mockResolvedValueOnce([bucket('a'), bucket('b')]);
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.buckets).toHaveLength(1));

  await act(async () => {
    await result.current.refetch();
  });
  expect(result.current.buckets).toHaveLength(2);
});
