import { archiveItem, confirmItem, deleteItem, getItem, ItemsError, regenerate, updateItem } from '../items';
import { supabase } from '../supabase';
import type { ItemRow } from '../mappers';

jest.mock('../supabase', () => ({
  supabase: { from: jest.fn(), functions: { invoke: jest.fn() } },
}));

const fromMock = supabase.from as jest.Mock;
const invokeMock = supabase.functions.invoke as jest.Mock;

function makeQB(result: { data: unknown; error: unknown }) {
  const qb: Record<string, unknown> = {};
  for (const m of ['select', 'in', 'order', 'insert', 'update', 'delete', 'eq']) {
    qb[m] = jest.fn(() => qb);
  }
  qb.single = jest.fn(() => Promise.resolve(result));
  qb.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return qb;
}

const row: ItemRow = {
  id: 'i1', source_url: 'https://a.com', source_type: 'article', storage_path: null, file_type: null,
  raw_content: 'x', note: null, summary: 'sum', tags: ['t'], suggested_bucket_id: null,
  suggested_bucket_name: null, bucket_id: null, status: 'ready', media_stage: 'not_needed',
  error: null, created_at: '2026-06-22T12:00:00Z', processed_at: null, confirmed_at: null, archived_at: null,
};

beforeEach(() => {
  fromMock.mockReset();
  invokeMock.mockReset();
});

it('getItem ritorna l\'elemento mappato', async () => {
  fromMock.mockReturnValue(makeQB({ data: row, error: null }));
  expect((await getItem('i1')).id).toBe('i1');
});

it('getItem lancia se non trovato', async () => {
  fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'no' } }));
  await expect(getItem('i1')).rejects.toBeInstanceOf(ItemsError);
});

it('updateItem normalizza la nota vuota a null', async () => {
  const qb = makeQB({ data: row, error: null });
  fromMock.mockReturnValue(qb);
  await updateItem('i1', { note: '   ', tags: ['a', 'b'] });
  expect(qb.update).toHaveBeenCalledWith({ note: null, tags: ['a', 'b'] });
});

it('confirmItem imposta bucket, stato saved e confirmed_at', async () => {
  const qb = makeQB({ data: { ...row, status: 'saved', bucket_id: 'b1' }, error: null });
  fromMock.mockReturnValue(qb);
  const item = await confirmItem('i1', 'b1');
  const patch = (qb.update as jest.Mock).mock.calls[0][0];
  expect(patch).toMatchObject({ bucket_id: 'b1', status: 'saved' });
  expect(typeof patch.confirmed_at).toBe('string');
  expect(item.status).toBe('saved');
});

it('archiveItem imposta lo stato archived e la data', async () => {
  const qb = makeQB({ data: { ...row, status: 'archived', archived_at: '2026-06-24T10:00:00Z' }, error: null });
  fromMock.mockReturnValue(qb);
  const item = await archiveItem('i1');
  const patch = (qb.update as jest.Mock).mock.calls[0][0];
  expect(patch).toMatchObject({ status: 'archived' });
  expect(typeof patch.archived_at).toBe('string');
  expect(item.status).toBe('archived');
});

it('archiveItem lancia in caso di errore', async () => {
  fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'boom' } }));
  await expect(archiveItem('i1')).rejects.toBeInstanceOf(ItemsError);
});

it('deleteItem lancia in caso di errore', async () => {
  fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'boom' } }));
  await expect(deleteItem('i1')).rejects.toBeInstanceOf(ItemsError);
});

it('regenerate invoca la edge function generate', async () => {
  invokeMock.mockResolvedValue({ data: null, error: null });
  await regenerate('i1');
  expect(invokeMock).toHaveBeenCalledWith('generate', { body: { item_id: 'i1' } });
});

it('regenerate lancia se la function fallisce', async () => {
  invokeMock.mockResolvedValue({ data: null, error: { message: 'x' } });
  await expect(regenerate('i1')).rejects.toBeInstanceOf(ItemsError);
});
