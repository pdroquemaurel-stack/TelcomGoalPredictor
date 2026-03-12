import { FixtureState, LeaderboardPeriod, LeaderboardScope, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculatePredictionPoints, isFixtureFinished, SCORING_RULES } from '@/lib/scoring';
import { rebuildLeaderboards } from '@/lib/services/leaderboard-service';
import { levelFromPoints } from '@/lib/utils';

function computeStreak(points: number[]): { currentStreak: number; bestStreak: number } {
  let currentStreak = 0;
  let bestStreak = 0;

  points.forEach((point) => {
    if (point > 0) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      return;
    }

    currentStreak = 0;
  });

  return { currentStreak, bestStreak };
}


export function scoreFixturePredictions(actualHomeScore: number, actualAwayScore: number, predictions: Array<{ id: string; userId: string; homeScore: number; awayScore: number; pointsAwarded: number }>) {
  return predictions.map((prediction) => ({
    id: prediction.id,
    userId: prediction.userId,
    computedPoints: calculatePredictionPoints(
      prediction.homeScore,
      prediction.awayScore,
      actualHomeScore,
      actualAwayScore,
    ),
  }));
}

async function rebuildProfileTotals(userId: string, prismaClient: PrismaClient) {
  const predictions = await prismaClient.prediction.findMany({
    where: { userId },
    include: { fixture: true },
    orderBy: [{ fixture: { utcKickoff: 'asc' } }],
  });

  const settledPredictions = predictions.filter((prediction) => prediction.fixture.fixtureState === FixtureState.SETTLED);
  const exactHits = settledPredictions.filter((prediction) => prediction.pointsAwarded === SCORING_RULES.exactScore).length;
  const totalPoints = settledPredictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0);
  const scoredPoints = settledPredictions.map((prediction) => prediction.pointsAwarded);
  const { currentStreak, bestStreak } = computeStreak(scoredPoints);

  await prismaClient.profile.update({
    where: { userId },
    data: {
      totalPredictions: predictions.length,
      exactHits,
      totalPoints,
      accuracyPct: predictions.length === 0 ? 0 : Math.round((exactHits / predictions.length) * 1000) / 10,
      currentStreak,
      bestStreak,
      level: levelFromPoints(totalPoints),
    },
  });
}

export async function settleFinishedFixtures(prismaClient: PrismaClient = prisma) {
  const candidateFixtures = await prismaClient.fixture.findMany({
    where: {
      fixtureState: { in: [FixtureState.SCHEDULED, FixtureState.LIVE, FixtureState.FINISHED] },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { predictions: true },
    orderBy: { utcKickoff: 'asc' },
  });

  let settledFixturesCount = 0;
  let updatedPredictionsCount = 0;
  const impactedUserIds = new Set<string>();

  for (const fixture of candidateFixtures) {
    if (!isFixtureFinished(fixture.statusText, fixture.homeScore, fixture.awayScore)) {
      continue;
    }

    await prismaClient.$transaction(async (tx) => {
      const freshFixture = await tx.fixture.findUnique({
        where: { id: fixture.id },
        include: { predictions: true },
      });

      if (!freshFixture || freshFixture.fixtureState === FixtureState.SETTLED) return;
      if (freshFixture.homeScore === null || freshFixture.awayScore === null) return;

      const scoredPredictions = scoreFixturePredictions(
        freshFixture.homeScore,
        freshFixture.awayScore,
        freshFixture.predictions,
      );

      for (const scoredPrediction of scoredPredictions) {
        const originalPrediction = freshFixture.predictions.find((item) => item.id === scoredPrediction.id)!;
        if (originalPrediction.pointsAwarded !== scoredPrediction.computedPoints) {
          await tx.prediction.update({ where: { id: scoredPrediction.id }, data: { pointsAwarded: scoredPrediction.computedPoints } });
          updatedPredictionsCount += 1;
        }

        impactedUserIds.add(scoredPrediction.userId);
      }

      await tx.fixture.update({
        where: { id: freshFixture.id },
        data: { fixtureState: FixtureState.SETTLED, predictionEnabled: false, statusText: 'SETTLED' },
      });

      settledFixturesCount += 1;
    });
  }

  for (const userId of impactedUserIds) {
    await rebuildProfileTotals(userId, prismaClient);
  }

  await rebuildLeaderboards(LeaderboardScope.AFRICA, LeaderboardPeriod.ALL_TIME, prismaClient);

  return {
    settledFixturesCount,
    updatedPredictionsCount,
    impactedUsersCount: impactedUserIds.size,
  };
}
