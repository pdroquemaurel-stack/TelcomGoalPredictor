import { prisma } from '@/lib/prisma';
import { getTeamLogoUrl } from '@/lib/team-logo';
import { buildChallengeLeaderboard } from '@/lib/services/challenge-leaderboard';

export function getActiveChallengesFilter(now = new Date()) {
  return {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
  };
}

export async function ensureChallengeFixtureLinks(challengeId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { competitions: true },
  });
  if (!challenge) return;

  const competitionIds = challenge.competitions.map((item) => item.competitionId);
  if (!competitionIds.length) return;

  const fixtures = await prisma.fixture.findMany({
    where: {
      competitionId: { in: competitionIds },
      utcKickoff: { gte: challenge.startDate, lte: challenge.endDate },
    },
    select: { id: true },
    take: 500,
  });

  for (const fixture of fixtures) {
    await prisma.challengeFixture.upsert({
      where: {
        challengeId_fixtureId: {
          challengeId,
          fixtureId: fixture.id,
        },
      },
      create: {
        challengeId,
        fixtureId: fixture.id,
      },
      update: {},
    });
  }
}

export async function getChallengeDetailBySlug(slug: string, userId: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: {
      competitions: { include: { competition: true } },
      fixtures: {
        include: {
          fixture: {
            include: {
              homeTeam: true,
              awayTeam: true,
              competition: true,
              predictions: { where: { userId }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!challenge) return null;

  const fixtures = challenge.fixtures
    .map((cf) => cf.fixture)
    .sort((a, b) => +new Date(a.utcKickoff) - +new Date(b.utcKickoff))
    .map((fixture) => ({
      id: fixture.id,
      kickoff: fixture.utcKickoff,
      competition: fixture.competition.name,
      home: fixture.homeTeam.name,
      away: fixture.awayTeam.name,
      homeLogoUrl: getTeamLogoUrl(fixture.homeTeam),
      awayLogoUrl: getTeamLogoUrl(fixture.awayTeam),
      canPredict: fixture.predictionEnabled,
      savedPrediction: fixture.predictions[0]
        ? {
            homeScore: fixture.predictions[0].homeScore,
            awayScore: fixture.predictions[0].awayScore,
          }
        : null,
    }));

  return {
    id: challenge.id,
    slug: challenge.slug,
    name: challenge.name,
    description: challenge.description,
    reward: challenge.reward,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    isActive: challenge.isActive,
    competitions: challenge.competitions.map((item) => item.competition.name),
    fixtures,
  };
}

export async function getChallengeLeaderboard(challengeId: string) {
  const predictions = await prisma.prediction.findMany({
    where: {
      fixture: {
        challengeFixtures: {
          some: { challengeId },
        },
      },
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      fixture: true,
    },
    take: 5000,
  });

  return buildChallengeLeaderboard(
    predictions.map((prediction) => ({
      userId: prediction.userId,
      displayName: prediction.user.profile?.displayName ?? prediction.user.email,
      predictedHome: prediction.homeScore,
      predictedAway: prediction.awayScore,
      finalHome: prediction.fixture.homeScore,
      finalAway: prediction.fixture.awayScore,
    })),
  );
}
