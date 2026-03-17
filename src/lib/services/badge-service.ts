import { BadgeCriterionType, FixtureState, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isBadgeEarned, type BadgeProgress } from '@/lib/badges';

function winnerCode(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'H';
  if (awayScore > homeScore) return 'A';
  return 'D';
}

export async function getUserBadgeProgress(userId: string, prismaClient: PrismaClient = prisma): Promise<BadgeProgress> {
  const [predictionCount, settledPredictions] = await Promise.all([
    prismaClient.prediction.count({ where: { userId } }),
    prismaClient.prediction.findMany({
      where: { userId, fixture: { fixtureState: FixtureState.SETTLED } },
      select: {
        homeScore: true,
        awayScore: true,
        fixture: { select: { homeScore: true, awayScore: true } },
      },
    }),
  ]);

  let exactPredictionCount = 0;
  let correctPredictionCount = 0;

  for (const prediction of settledPredictions) {
    const fixtureHome = prediction.fixture.homeScore;
    const fixtureAway = prediction.fixture.awayScore;
    if (fixtureHome === null || fixtureAway === null) continue;

    if (prediction.homeScore === fixtureHome && prediction.awayScore === fixtureAway) {
      exactPredictionCount += 1;
    }

    if (winnerCode(prediction.homeScore, prediction.awayScore) === winnerCode(fixtureHome, fixtureAway)) {
      correctPredictionCount += 1;
    }
  }

  return {
    predictionCount,
    correctPredictionCount,
    exactPredictionCount,
  };
}

export async function assignBadgesForUser(userId: string, prismaClient: PrismaClient = prisma) {
  const [badges, progress, userBadges] = await Promise.all([
    prismaClient.badge.findMany({
      where: { isActive: true },
      select: { id: true, criterionType: true, threshold: true },
    }),
    getUserBadgeProgress(userId, prismaClient),
    prismaClient.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);

  const ownedBadgeIds = new Set(userBadges.map((badge) => badge.badgeId));
  const earnedBadgeIds = badges
    .filter((badge) => isBadgeEarned(badge.criterionType, badge.threshold, progress))
    .filter((badge) => !ownedBadgeIds.has(badge.id))
    .map((badge) => badge.id);

  if (earnedBadgeIds.length === 0) return { assignedCount: 0 };

  await prismaClient.userBadge.createMany({
    data: earnedBadgeIds.map((badgeId) => ({ userId, badgeId })),
    skipDuplicates: true,
  });

  return { assignedCount: earnedBadgeIds.length };
}

export function isCriterionType(value: string): value is BadgeCriterionType {
  return Object.values(BadgeCriterionType).includes(value as BadgeCriterionType);
}
