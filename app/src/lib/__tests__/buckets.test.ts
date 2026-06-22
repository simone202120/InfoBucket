import { BucketsError, createBucket, listBuckets } from '../buckets';
import { supabase } from '../supabase';
import type { BucketRow } from '../mappers';

jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));
const fromMock = supabase.from as jest.Mock;

function makeQB(result: { data: unknown; error: unknown }) {
  const qb: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'insert']) qb[m] = jest.fn(() => qb);
  qb.single = jest.fn(() => Promise.resolve(result));
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

it('createBucket rifiuta un nome vuoto senza toccare il DB', async () => {
  await expect(createBucket({ name: '  ' })).rejects.toBeInstanceOf(BucketsError);
  expect(fromMock).not.toHaveBeenCalled();
});

it('createBucket inserisce nome e descrizione normalizzati', async () => {
  const qb = makeQB({ data: row, error: null });
  fromMock.mockReturnValue(qb);
  await createBucket({ name: '  Cucina  ', description: '  ricette  ' });
  expect(qb.insert).toHaveBeenCalledWith({ name: 'Cucina', description: 'ricette' });
});
