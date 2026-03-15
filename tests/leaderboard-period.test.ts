import test from 'node:test';
import assert from 'node:assert/strict';
import { getPeriodStart, toRankedRows } from '@/lib/leaderboard-period';

test('getPeriodStart returns null for all-time and valid dates for weekly/monthly', () => {
  const now = new Date('2026-04-10T10:00:00.000Z');
  assert.equal(getPeriodStart('all-time', now), null);
  assert.equal(getPeriodStart('weekly', now)?.toISOString(), '2026-04-03T10:00:00.000Z');
  assert.equal(getPeriodStart('monthly', now)?.toISOString(), '2026-03-10T10:00:00.000Z');
});

test('toRankedRows keeps stable tie ordering by exact hits then username', () => {
  const ranked = toRankedRows([
    { userId: 'u1', displayName: 'A', username: 'zeta', countryName: 'X', totalPredictions: 1, points: 20, exactHits: 2 },
    { userId: 'u2', displayName: 'B', username: 'alpha', countryName: 'X', totalPredictions: 1, points: 20, exactHits: 2 },
    { userId: 'u3', displayName: 'C', username: 'mid', countryName: 'X', totalPredictions: 1, points: 20, exactHits: 3 },
  ]);

  assert.deepEqual(ranked.map((row) => row.userId), ['u3', 'u2', 'u1']);
  assert.deepEqual(ranked.map((row) => row.rank), [1, 2, 3]);
});
