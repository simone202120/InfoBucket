import { DAYS_TO_ARCHIVE, DAYS_TO_DELETE, daysLeft, isExpiring } from '../lifecycle';

const NOW = new Date('2026-06-22T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

describe('daysLeft', () => {
  it('conta i giorni verso l\'archivio per item ready', () => {
    expect(daysLeft({ status: 'ready', createdAt: daysAgo(0), archivedAt: null }, NOW)).toBe(DAYS_TO_ARCHIVE);
    expect(daysLeft({ status: 'ready', createdAt: daysAgo(5), archivedAt: null }, NOW)).toBe(2);
  });

  it('non scende mai sotto zero', () => {
    expect(daysLeft({ status: 'ready', createdAt: daysAgo(99), archivedAt: null }, NOW)).toBe(0);
  });

  it('conta i giorni verso la cancellazione per item archived', () => {
    expect(daysLeft({ status: 'archived', createdAt: daysAgo(30), archivedAt: daysAgo(0) }, NOW)).toBe(DAYS_TO_DELETE);
    expect(daysLeft({ status: 'archived', createdAt: daysAgo(30), archivedAt: daysAgo(18) }, NOW)).toBe(2);
  });

  it('saved non decade mai', () => {
    expect(daysLeft({ status: 'saved', createdAt: daysAgo(100), archivedAt: null }, NOW)).toBeNull();
  });
});

describe('isExpiring', () => {
  it('è vero entro 2 giorni dalla transizione', () => {
    expect(isExpiring({ status: 'ready', createdAt: daysAgo(6), archivedAt: null }, NOW)).toBe(true);
    expect(isExpiring({ status: 'ready', createdAt: daysAgo(1), archivedAt: null }, NOW)).toBe(false);
  });
});
