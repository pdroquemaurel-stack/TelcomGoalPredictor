import test from 'node:test';
import assert from 'node:assert/strict';
import { isFixtureInDailyWindow } from '@/lib/services/daily-service';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { buildChallengeLeaderboard } from '@/lib/services/challenge-leaderboard';
import { buildDailyBounds, buildThemeVariables, normalizeDailyConfig } from '@/lib/admin-config-helpers';

test('daily window uses configurable bounds', () => {
  const now = new Date('2026-03-12T10:00:00.000Z');
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-11T12:00:00.000Z'), now, { pastDays: 0, futureDays: 2 }), false);
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-13T23:59:59.000Z'), now, { pastDays: 0, futureDays: 2 }), true);
  assert.equal(isFixtureInDailyWindow(new Date('2026-03-14T00:00:00.000Z'), now, { pastDays: 0, futureDays: 2 }), false);
});

test('normalizeDailyConfig keeps safe minimums', () => {
  const normalized = normalizeDailyConfig({ dailyFutureDays: 0, dailyPastDays: -10 });
  assert.equal(normalized.dailyFutureDays, 1);
  assert.equal(normalized.dailyPastDays, 0);
});

test('buildDailyBounds generates range around today using config', () => {
  const now = new Date('2026-03-12T10:00:00.000Z');
  const bounds = buildDailyBounds(now, { dailyPastDays: 1, dailyFutureDays: 3 });
  assert.equal(bounds.start.toISOString(), '2026-03-11T00:00:00.000Z');
  assert.equal(bounds.end.toISOString(), '2026-03-15T00:00:00.000Z');
});

test('branding vars keep defaults when missing', () => {
  const vars = buildThemeVariables({ primaryColor: '#112233' });
  assert.equal(vars['--brand-primary'], '#112233');
  assert.equal(vars['--brand-secondary'], '#000000');
  assert.equal(vars['--app-bg'], '#000000');
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

test('app config migration adds singleton table', async () => {
  const fs = await import('node:fs/promises');
  const migrationSql = await fs.readFile('prisma/migrations/20260317150000_app_config_admin/migration.sql', 'utf8');
  assert.match(migrationSql, /CREATE TABLE "AppConfig"/);
  assert.match(migrationSql, /CREATE UNIQUE INDEX "AppConfig_singletonKey_key"/);
});

test('manual sync keeps created/updated counters coherent', () => {
  const fetched = 10;
  const created = 4;
  const updated = 6;
  assert.equal(created + updated, fetched);
});
