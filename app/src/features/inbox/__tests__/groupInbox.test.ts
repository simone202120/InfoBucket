import { groupInbox } from '../groupInbox';
import type { Item } from '@/types/domain';

const NOW = new Date('2026-06-22T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const item = (over: Partial<Item>): Item => ({
  id: 'x',
  sourceUrl: 'https://a.com',
  sourceType: 'article',
  storagePath: null,
  fileType: null,
  rawContent: null,
  note: null,
  summary: null,
  tags: [],
  suggestedBucketId: null,
  suggestedBucketName: null,
  bucketId: null,
  status: 'ready',
  mediaStage: 'not_needed',
  error: null,
  createdAt: daysAgo(0),
  processedAt: null,
  confirmedAt: null,
  archivedAt: null,
  ...over,
});

it('separa gli item in scadenza dai recenti mantenendo l\'ordine', () => {
  const a = item({ id: 'a', createdAt: daysAgo(6) }); // ready da 6 giorni → expiring (≤2 alla soglia)
  const b = item({ id: 'b', createdAt: daysAgo(0) }); // recente
  const { expiring, recent } = groupInbox([a, b], NOW);
  expect(expiring.map((i) => i.id)).toEqual(['a']);
  expect(recent.map((i) => i.id)).toEqual(['b']);
});

it('un item in lavorazione non è mai "in scadenza"', () => {
  const p = item({ id: 'p', status: 'processing', createdAt: daysAgo(99) });
  const { expiring, recent } = groupInbox([p], NOW);
  expect(expiring).toHaveLength(0);
  expect(recent.map((i) => i.id)).toEqual(['p']);
});
