import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSearch } from '../useSearch';
import { searchItems } from '@/lib/items';
import type { Item } from '@/types/domain';

jest.mock('@/lib/items', () => ({ searchItems: jest.fn() }));
const searchMock = searchItems as jest.Mock;

const item = (id: string): Item => ({
  id, sourceUrl: 'https://a.com', sourceType: 'article', storagePath: null, fileType: null,
  rawContent: null, note: null, summary: 's', tags: [], suggestedBucketId: null,
  suggestedBucketName: null, bucketId: null, status: 'saved', mediaStage: 'not_needed',
  error: null, createdAt: '2026-06-22T12:00:00Z', processedAt: null, confirmedAt: null, archivedAt: null,
});

beforeEach(() => searchMock.mockReset());

it('non cerca con query vuota', async () => {
  const { result } = renderHook(() => useSearch());
  await act(async () => { await result.current.run(); });
  expect(searchMock).not.toHaveBeenCalled();
  expect(result.current.searched).toBe(false);
});

it('esegue la ricerca e popola i risultati', async () => {
  searchMock.mockResolvedValue([item('a'), item('b')]);
  const { result } = renderHook(() => useSearch());
  act(() => result.current.setQuery('pasta'));
  await act(async () => { await result.current.run(); });
  expect(searchMock).toHaveBeenCalledWith('pasta');
  expect(result.current.results).toHaveLength(2);
  expect(result.current.searched).toBe(true);
});

it('espone un errore se la ricerca fallisce', async () => {
  searchMock.mockRejectedValue(new Error('Ricerca non riuscita.'));
  const { result } = renderHook(() => useSearch());
  act(() => result.current.setQuery('x'));
  await act(async () => { await result.current.run(); });
  await waitFor(() => expect(result.current.error).toBe('Ricerca non riuscita.'));
});
