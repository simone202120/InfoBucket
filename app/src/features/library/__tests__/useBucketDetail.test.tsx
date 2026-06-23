import { renderHook, waitFor } from '@testing-library/react-native';
import { useBucketDetail } from '../useBucketDetail';
import { listBucketOverviews } from '@/lib/buckets';
import { listBucketItems } from '@/lib/items';
import type { BucketOverview, Item } from '@/types/domain';

jest.mock('@/lib/buckets', () => ({ listBucketOverviews: jest.fn() }));
jest.mock('@/lib/items', () => ({ listBucketItems: jest.fn() }));
const overviewsMock = listBucketOverviews as jest.Mock;
const itemsMock = listBucketItems as jest.Mock;

const overview: BucketOverview = {
  id: 'b1',
  name: 'Machine learning',
  description: 'Paper da finire.',
  createdAt: '2026-06-22T12:00:00Z',
  itemCount: 1,
  sources: ['article'],
};

const item: Item = {
  id: 'i1', sourceUrl: 'https://a.com', sourceType: 'article', storagePath: null, fileType: null,
  rawContent: null, note: null, summary: 's', tags: [], suggestedBucketId: null,
  suggestedBucketName: null, bucketId: 'b1', status: 'saved', mediaStage: 'not_needed',
  error: null, createdAt: '2026-06-01T12:00:00Z', processedAt: null, confirmedAt: '2026-06-02T12:00:00Z',
  archivedAt: null,
};

beforeEach(() => {
  overviewsMock.mockReset();
  itemsMock.mockReset();
});

it('carica testata e elementi del bucket', async () => {
  overviewsMock.mockResolvedValue([overview]);
  itemsMock.mockResolvedValue([item]);
  const { result } = renderHook(() => useBucketDetail('b1'));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(itemsMock).toHaveBeenCalledWith('b1');
  expect(result.current.bucket?.name).toBe('Machine learning');
  expect(result.current.items).toHaveLength(1);
});

it('lascia bucket a null se l’id non esiste', async () => {
  overviewsMock.mockResolvedValue([overview]);
  itemsMock.mockResolvedValue([]);
  const { result } = renderHook(() => useBucketDetail('ignoto'));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.bucket).toBeNull();
  expect(result.current.items).toHaveLength(0);
});

it('espone un errore se il caricamento fallisce', async () => {
  overviewsMock.mockResolvedValue([overview]);
  itemsMock.mockRejectedValue(new Error('Impossibile caricare gli elementi del bucket.'));
  const { result } = renderHook(() => useBucketDetail('b1'));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Impossibile caricare gli elementi del bucket.');
});
