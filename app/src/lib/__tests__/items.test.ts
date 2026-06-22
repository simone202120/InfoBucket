import { addItemByUrl, ItemsError, listInbox } from '../items';
import { supabase } from '../supabase';
import type { ItemRow } from '../mappers';

jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));

const fromMock = supabase.from as jest.Mock;

/** Query builder finto: ogni metodo è concatenabile e l'oggetto è "awaitable". */
function makeQB(result: { data: unknown; error: unknown }) {
  const qb: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'order', 'insert']) {
    qb[m] = jest.fn(() => qb);
  }
  qb.single = jest.fn(() => Promise.resolve(result));
  qb.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return qb;
}

const row: ItemRow = {
  id: 'i1',
  source_url: 'https://example.com/post',
  source_type: 'article',
  storage_path: null,
  file_type: null,
  raw_content: null,
  note: 'una nota',
  summary: null,
  tags: null,
  suggested_bucket_id: null,
  suggested_bucket_name: null,
  bucket_id: null,
  status: 'processing',
  media_stage: 'not_needed',
  error: null,
  created_at: '2026-06-22T12:00:00Z',
  processed_at: null,
  confirmed_at: null,
  archived_at: null,
};

beforeEach(() => fromMock.mockReset());

describe('listInbox', () => {
  it('ritorna gli item mappati a dominio', async () => {
    fromMock.mockReturnValue(makeQB({ data: [row], error: null }));
    const items = await listInbox();
    expect(fromMock).toHaveBeenCalledWith('items');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'i1', sourceUrl: 'https://example.com/post', tags: [] });
  });

  it('lancia ItemsError in caso di errore DB', async () => {
    fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'boom' } }));
    await expect(listInbox()).rejects.toBeInstanceOf(ItemsError);
  });
});

describe('addItemByUrl', () => {
  it('rifiuta URL non validi senza toccare il DB', async () => {
    await expect(addItemByUrl({ url: 'non-un-url' })).rejects.toBeInstanceOf(ItemsError);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserisce con source_type rilevato e nota normalizzata', async () => {
    const qb = makeQB({ data: row, error: null });
    fromMock.mockReturnValue(qb);
    const item = await addItemByUrl({ url: '  https://www.youtube.com/watch?v=x  ', note: '  ' });

    expect(qb.insert).toHaveBeenCalledWith({
      source_url: 'https://www.youtube.com/watch?v=x',
      source_type: 'youtube',
      note: null,
      status: 'processing',
    });
    expect(item.id).toBe('i1');
  });

  it('lancia ItemsError se il DB fallisce', async () => {
    fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'x' } }));
    await expect(addItemByUrl({ url: 'https://a.com' })).rejects.toBeInstanceOf(ItemsError);
  });
});
