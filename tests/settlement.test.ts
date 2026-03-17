import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureState, LeaderboardPeriod, LeaderboardScope } from '@prisma/client';
import { scoreFixturePredictions, settleFinishedFixtures } from '@/lib/services/settlement-service';

type StoreFixture = {
  id: string;
  externalId: string;
  statusText: string;
  homeScore: number | null;
  awayScore: number | null;
  fixtureState: FixtureState;
  predictionEnabled: boolean;
  utcKickoff: Date;
};

type StorePrediction = {
  id: string;
  userId: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  pointsAwarded: number;
};

type StoreProfile = {
  userId: string;
  totalPredictions: number;
  exactHits: number;
  totalPoints: number;
  accuracyPct: number;
  currentStreak: number;
  bestStreak: number;
  level: string;
};

function createMockPrisma() {
  const fixtures = new Map<string, StoreFixture>();
  const predictions = new Map<string, StorePrediction>();
  const profiles = new Map<string, StoreProfile>();
  const users = new Map<string, { createdAt: Date }>();
  const leaderboardRows: Array<{ userId: string; rank: number; points: number }> = [];

  const fixtureWithPredictions = (fixture: StoreFixture) => ({
    ...fixture,
    predictions: [...predictions.values()].filter((prediction) => prediction.fixtureId === fixture.id),
  });

  const client: any = {
    fixture: {
      findMany: async ({ where }: any) => {
        if (where?.id?.in) {
          return where.id.in.map((id: string) => fixtures.get(id)).filter(Boolean).map(fixtureWithPredictions);
        }

        return [...fixtures.values()]
          .filter((fixture) => {
            const eligibleState = where?.fixtureState?.in
              ? where.fixtureState.in.includes(fixture.fixtureState)
              : true;
            const hasScores = where?.homeScore?.not === null && where?.awayScore?.not === null
              ? fixture.homeScore !== null && fixture.awayScore !== null
              : true;

            return eligibleState && hasScores;
          })
          .sort((a, b) => a.utcKickoff.getTime() - b.utcKickoff.getTime())
          .map(fixtureWithPredictions);
      },
      findUnique: async ({ where }: any) => {
        const fixture = fixtures.get(where.id);
        return fixture ? fixtureWithPredictions(fixture) : null;
      },
      update: async ({ where, data }: any) => {
        const fixture = fixtures.get(where.id)!;
        fixtures.set(where.id, { ...fixture, ...data });
      },
    },
    prediction: {
      update: async ({ where, data }: any) => {
        const prediction = predictions.get(where.id)!;
        predictions.set(where.id, { ...prediction, ...data });
      },
      count: async ({ where }: any) => [...predictions.values()].filter((prediction) => prediction.userId === where.userId).length,
      findMany: async ({ where, include, select }: any) => {
        const rows = [...predictions.values()].filter((prediction) => prediction.userId === where.userId);

        if (where.fixture?.fixtureState) {
          return rows
            .filter((prediction) => fixtures.get(prediction.fixtureId)?.fixtureState === where.fixture.fixtureState)
            .map((prediction) => ({
              homeScore: prediction.homeScore,
              awayScore: prediction.awayScore,
              fixture: {
                homeScore: fixtures.get(prediction.fixtureId)?.homeScore ?? null,
                awayScore: fixtures.get(prediction.fixtureId)?.awayScore ?? null,
              },
            }));
        }

        if (include?.fixture) {
          return rows
            .map((prediction) => ({ ...prediction, fixture: fixtures.get(prediction.fixtureId)! }))
            .sort((a, b) => a.fixture.utcKickoff.getTime() - b.fixture.utcKickoff.getTime());
        }

        if (select) return rows;
        return rows;
      },
    },
    profile: {
      update: async ({ where, data }: any) => {
        const existing = profiles.get(where.userId) ?? {
          userId: where.userId,
          totalPredictions: 0,
          exactHits: 0,
          totalPoints: 0,
          accuracyPct: 0,
          currentStreak: 0,
          bestStreak: 0,
          level: 'BRONZE',
        };

        profiles.set(where.userId, { ...existing, ...data });
      },
      findMany: async () => {
        return [...profiles.values()]
          .map((profile) => ({ ...profile, user: users.get(profile.userId)! }))
          .sort((a, b) => b.totalPoints - a.totalPoints || b.exactHits - a.exactHits || a.user.createdAt.getTime() - b.user.createdAt.getTime());
      },
    },
    badge: {
      findMany: async () => [],
    },
    userBadge: {
      findMany: async () => [],
      createMany: async () => ({ count: 0 }),
    },
    leaderboardSnapshot: {
      deleteMany: async ({ where }: any) => {
        for (let i = leaderboardRows.length - 1; i >= 0; i -= 1) {
          const row = leaderboardRows[i];
          if ((row as any).scope === where.scope && (row as any).period === where.period) {
            leaderboardRows.splice(i, 1);
          }
        }
      },
      createMany: async ({ data }: any) => {
        leaderboardRows.push(...data);
      },
    },
    $transaction: async (input: any) => {
      if (typeof input === 'function') {
        return input(client);
      }

      return Promise.all(input);
    },
    __seedFixture: (fixture: StoreFixture) => fixtures.set(fixture.id, fixture),
    __seedPrediction: (prediction: StorePrediction) => predictions.set(prediction.id, prediction),
    __seedProfile: (profile: StoreProfile) => profiles.set(profile.userId, profile),
    __seedUser: (userId: string, createdAt: Date = new Date('2024-01-01T00:00:00Z')) => users.set(userId, { createdAt }),
    __getFixture: (id: string) => fixtures.get(id)!,
    __getPrediction: (id: string) => predictions.get(id)!,
    __getProfile: (userId: string) => profiles.get(userId)!,
    __getLeaderboardRows: () => leaderboardRows,
  };

  return client;
}

test('scoreFixturePredictions computes points for each prediction', () => {
  const predictions = [
    { id: 'p1', userId: 'u1', homeScore: 2, awayScore: 1, pointsAwarded: 0 },
    { id: 'p2', userId: 'u2', homeScore: 1, awayScore: 0, pointsAwarded: 0 },
    { id: 'p3', userId: 'u3', homeScore: 0, awayScore: 2, pointsAwarded: 0 },
  ];

  const scored = scoreFixturePredictions(2, 1, predictions);

  assert.deepEqual(scored, [
    { id: 'p1', userId: 'u1', computedPoints: 3 },
    { id: 'p2', userId: 'u2', computedPoints: 1 },
    { id: 'p3', userId: 'u3', computedPoints: 0 },
  ]);
});

test('settlement + resettlement remain idempotent and rescore correctly after score corrections', async () => {
  const prisma = createMockPrisma();

  prisma.__seedUser('u1');
  prisma.__seedProfile({
    userId: 'u1',
    totalPredictions: 0,
    exactHits: 0,
    totalPoints: 0,
    accuracyPct: 0,
    currentStreak: 0,
    bestStreak: 0,
    level: 'BRONZE',
  });

  prisma.__seedFixture({
    id: 'f1',
    externalId: 'fx-1',
    statusText: 'FT',
    homeScore: 2,
    awayScore: 1,
    fixtureState: FixtureState.FINISHED,
    predictionEnabled: false,
    utcKickoff: new Date('2026-01-10T12:00:00Z'),
  });
  prisma.__seedPrediction({
    id: 'p1',
    userId: 'u1',
    fixtureId: 'f1',
    homeScore: 2,
    awayScore: 1,
    pointsAwarded: 0,
  });

  const firstSettlement = await settleFinishedFixtures(prisma);
  assert.equal(firstSettlement.settledFixturesCount, 1);
  assert.equal(firstSettlement.resettledFixturesCount, 0);
  assert.equal(firstSettlement.updatedPredictionsCount, 1);
  assert.equal(prisma.__getPrediction('p1').pointsAwarded, 3);
  assert.equal(prisma.__getFixture('f1').fixtureState, FixtureState.SETTLED);
  assert.equal(prisma.__getFixture('f1').statusText, 'SETTLED');
  assert.equal(prisma.__getProfile('u1').totalPoints, 3);

  const secondSettlement = await settleFinishedFixtures(prisma);
  assert.equal(secondSettlement.settledFixturesCount, 0);
  assert.equal(secondSettlement.resettledFixturesCount, 1);
  assert.equal(secondSettlement.updatedPredictionsCount, 0);
  assert.equal(prisma.__getPrediction('p1').pointsAwarded, 3);
  assert.equal(prisma.__getProfile('u1').totalPoints, 3);

  prisma.__seedFixture({
    ...prisma.__getFixture('f1'),
    statusText: 'SETTLED',
    homeScore: 2,
    awayScore: 0,
    fixtureState: FixtureState.SETTLED,
  });

  const correctionSettlement = await settleFinishedFixtures(prisma);
  assert.equal(correctionSettlement.resettledFixturesCount, 1);
  assert.equal(correctionSettlement.updatedPredictionsCount, 1);
  assert.equal(prisma.__getPrediction('p1').pointsAwarded, 1);
  assert.equal(prisma.__getProfile('u1').totalPoints, 1);
  assert.equal(prisma.__getFixture('f1').fixtureState, FixtureState.SETTLED);

  prisma.__seedFixture({
    ...prisma.__getFixture('f1'),
    statusText: 'SETTLED',
    homeScore: 2,
    awayScore: 1,
    fixtureState: FixtureState.SETTLED,
  });

  const reverseCorrectionSettlement = await settleFinishedFixtures(prisma);
  assert.equal(reverseCorrectionSettlement.resettledFixturesCount, 1);
  assert.equal(reverseCorrectionSettlement.updatedPredictionsCount, 1);
  assert.equal(prisma.__getPrediction('p1').pointsAwarded, 3);
  assert.equal(prisma.__getProfile('u1').totalPoints, 3);

  const leaderboardRows = prisma.__getLeaderboardRows().filter((row: any) => row.scope === LeaderboardScope.AFRICA && row.period === LeaderboardPeriod.ALL_TIME);
  assert.equal(leaderboardRows.length, 1);
  assert.equal(leaderboardRows[0].userId, 'u1');
  assert.equal(leaderboardRows[0].points, 3);
});
