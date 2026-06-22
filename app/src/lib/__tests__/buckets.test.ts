import {
  BucketsError,
  createBucket,
  deleteBucket,
  findBucketByName,
  listBucketOverviews,
  listBuckets,
  updateBucket,
} from '../buckets';
import { supabase } from '../supabase';
import type { BucketOverviewRow, BucketRow } from '../mappers';

jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));
const fromMock = supabase.from as jest.Mock;

/** Query builder finto: ogni metodo è chainable; single/maybeSingle e `then`
 *  risolvono il `result` passato (così funziona sia con .single() sia con await). */
function makeQB(result: { data: unknown; error: unknown }) {
  const qb: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'insert', 'update', 'delete', 'eq', 'ilike', 'limit']) {
    qb[m] = jest.fn(() => qb);
  }
  qb.single = jest.fn(() => Promise.resolve(result));
  qb.maybeSingle = jest.fn(() => Promise.resolve(result));
  qb.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return qb;
}

const row: BucketRow = { id: 'b1', name: 'Cucina', description: 'ricette', created_at: '2026-06-22T12:00:00Z' };

beforeEach(() => fromMock.mockReset());

it('listBuckets ritorna i bucket mappati', async () => {
  fromMock.mockReturnValue(makeQB({ data: [row], error: null }));
  const buckets = await listBuckets();
  expect(buckets[0]).toMatchObject({ id: 'b1', name: 'Cucina', description: 'ricette' });
});

it('listBucketOverviews mappa conteggio e fonti', async () => {
  const ovRow: BucketOverviewRow = { ...row, item_count: 3, sources: ['article', 'tiktok'] };
  fromMock.mockReturnValue(makeQB({ data: [ovRow], error: null }));
  const [bucket] = await listBucketOverviews();
  expect(bucket).toMatchObject({ id: 'b1', itemCount: 3, sources: ['article', 'tiktok'] });
});

it('createBucket rifiuta un nome vuoto senza toccare il DB', async () => {
  await expect(createBucket({ name: '  ' })).rejects.toBeInstanceOf(BucketsError);
  expect(fromMock).not.toHaveBeenCalled();
});

it('createBucket riusa un bucket esistente (find-or-create) senza inserire', async () => {
  const findQB = makeQB({ data: row, error: null });
  fromMock.mockReturnValue(findQB);
  const bucket = await createBucket({ name: 'cucina' }); // nome diverso solo nel case
  expect(bucket).toMatchObject({ id: 'b1', name: 'Cucina' });
  expect(findQB.ilike).toHaveBeenCalledWith('name', 'cucina');
  expect(findQB.insert).not.toHaveBeenCalled();
});

it('createBucket inserisce nome e descrizione normalizzati se non esiste', async () => {
  const findQB = makeQB({ data: null, error: null }); // nessun bucket esistente
  const insertQB = makeQB({ data: row, error: null });
  fromMock.mockReturnValueOnce(findQB).mockReturnValueOnce(insertQB);
  await createBucket({ name: '  Cucina  ', description: '  ricette  ' });
  expect(insertQB.insert).toHaveBeenCalledWith({ name: 'Cucina', description: 'ricette' });
});

it('findBucketByName ritorna null senza query per nome vuoto', async () => {
  expect(await findBucketByName('   ')).toBeNull();
  expect(fromMock).not.toHaveBeenCalled();
});

it('updateBucket rifiuta un nome svuotato', async () => {
  await expect(updateBucket('b1', { name: '  ' })).rejects.toBeInstanceOf(BucketsError);
});

it('updateBucket aggiorna i campi normalizzati', async () => {
  const qb = makeQB({ data: { ...row, name: 'Viaggi' }, error: null });
  fromMock.mockReturnValue(qb);
  await updateBucket('b1', { name: ' Viaggi ', description: '  ' });
  expect(qb.update).toHaveBeenCalledWith({ name: 'Viaggi', description: null });
});

it('deleteBucket propaga un errore di dominio', async () => {
  fromMock.mockReturnValue(makeQB({ data: null, error: { message: 'x' } }));
  await expect(deleteBucket('b1')).rejects.toBeInstanceOf(BucketsError);
});
