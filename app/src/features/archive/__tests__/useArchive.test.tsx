import { renderHook, waitFor } from '@testing-library/react-native';
import { useArchive } from '../useArchive';
import { listArchived } from '@/lib/items';
import type { Item } from '@/types/domain';

jest.mock('@/lib/items', () => ({ listArchived: jest.fn() }));
const listArchivedMock = listArchived as jest.Mock;

const item: Item = {
  id: 'a', sourceUrl: 'https://a.com', sourceType: 'article', storagePath: null, fileType: null,
  rawContent: null, note: null, summary: 's', tags: [], suggestedBucketId: null,
  suggestedBucketName: null, bucketId: null, status: 'archived', mediaStage: 'not_needed',
  error: null, createdAt: '2026-06-01T12:00:00Z', processedAt: null, confirmedAt: null,
  archivedAt: '2026-06-20T12:00:00Z',
};

beforeEach(() => listArchivedMock.mockReset());

it('carica gli archiviati al mount', async () => {
  listArchivedMock.mockResolvedValue([item]);
  const { result } = renderHook(() => useArchive());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(listArchivedMock).toHaveBeenCalled();
  expect(result.current.items).toHaveLength(1);
});
