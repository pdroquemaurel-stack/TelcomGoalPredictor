import test from 'node:test';
import assert from 'node:assert/strict';
import { adminSyncResultSchema, operationsSummarySchema } from '@/lib/admin-sync-contract';

test('admin sync contract accepte un payload métier valide', () => {
  const parsed = adminSyncResultSchema.safeParse({
    success: true,
    from: '2026-01-01',
    to: '2026-01-10',
    competitionsSynced: 1,
    competitionsFetched: 1,
    fixturesCreated: 2,
    fixturesUpdated: 3,
    fixturesSkipped: 0,
    fixturesFetched: 5,
    fixturesProcessed: 5,
    settlement: {
      settledFixturesCount: 1,
      resettledFixturesCount: 0,
      updatedPredictionsCount: 3,
      impactedUsersCount: 2,
    },
    errors: [],
  });

  assert.equal(parsed.success, true);
});

test('operations summary contract rejette un payload incohérent', () => {
  const parsed = operationsSummarySchema.safeParse({
    competitions: 1,
    fixtures: 1,
    visibleFixtures: 1,
    liveFixtures: 0,
    finishedFixtures: 0,
    finishedWithoutScore: 0,
    unsettledFinished: 0,
    users: 1,
    predictions: 0,
    badges: 0,
    dailyCompetitions: 0,
    activeChallenges: 0,
    lastSyncAt: 'invalid-date',
    problematicFixtures: [],
  });

  assert.equal(parsed.success, false);
});
