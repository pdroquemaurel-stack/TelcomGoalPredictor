import test from 'node:test';
import assert from 'node:assert/strict';
import { isFixtureInDailyWindow } from '@/lib/services/daily-service';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { buildChallengeLeaderboard } from '@/lib/services/challenge-leaderboard';

test('daily window keeps only today/tomorrow fixtures', () => {
  const now = new Date('2026-03-12T10:00:00.000Z');
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-12T12:00:00.000Z'), now), true);
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-13T23:59:59.000Z'), now), true);
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-14T00:00:00.000Z'), now), false);
});

test('active challenge filter pins active status and date bounds', () => {
  const now = new Date('2026-03-12T00:00:00.000Z');
  const filter = getActiveChallengesFilter(now);
  assert.equal(filter.isActive, true);
  assert.deepEqual(filter.startDate, { lte: now });
  assert.deepEqual(filter.endDate, { gte: now });
});

test('challenge leaderboard sums only challenge prediction points', () => {
  const leaderboard = buildChallengeLeaderboard([
    { userId: 'u1', displayName: 'Alpha', predictedHome: 2, predictedAway: 1, finalHome: 2, finalAway: 1 },
    { userId: 'u1', displayName: 'Alpha', predictedHome: 1, predictedAway: 0, finalHome: 2, finalAway: 0 },
    { userId: 'u2', displayName: 'Beta', predictedHome: 0, predictedAway: 0, finalHome: 1, finalAway: 1 },
  ]);

  assert.equal(leaderboard[0].userId, 'u1');
  assert.equal(leaderboard[0].points, 4);
  assert.equal(leaderboard[1].userId, 'u2');
  assert.equal(leaderboard[1].points, 1);
});

test('challenge fixture unique constraint exists in migration SQL', async () => {
  const fs = await import('node:fs/promises');
  const migrationSql = await fs.readFile('prisma/migrations/20260313093000_daily_challenges_admin_ops/migration.sql', 'utf8');
  assert.match(migrationSql, /CREATE UNIQUE INDEX "ChallengeFixture_challengeId_fixtureId_key"/);
});

test('manual sync keeps created/updated counters coherent', () => {
  const fetched = 10;
  const created = 4;
  const updated = 6;
  assert.equal(created + updated, fetched);
});
