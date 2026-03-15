import { NextResponse } from 'next/server';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/session-user';
import { getTeamLogoUrl } from '@/lib/team-logo';
import { calculateMatchOdds, filterOutCurrentUserPredictions, type ScorePrediction } from '@/lib/prediction-odds';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get('competitionId');

  const user = await getAuthenticatedUser();
  const playerId = user?.id ?? '__anonymous__';

  const competitions = await prisma.competition.findMany({
    where: { visible: true, active: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      fixtures: {
        where: { predictionEnabled: true, visible: true },
        include: { predictions: { where: { userId: playerId }, select: { id: true } } },
      },
    },
  });

  const activeCompetitionId = competitionId ?? competitions[0]?.id;

  const fixtures = await prisma.fixture.findMany({
    where: { predictionEnabled: true, visible: true, competitionId: activeCompetitionId },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      predictions: { where: { userId: playerId }, take: 1 },
    },
    orderBy: [{ utcKickoff: 'asc' }],
    take: 300,
  });

  const fixtureIds = fixtures.map((fixture) => fixture.id);
  const predictionsByFixture = fixtureIds.length
    ? await prisma.prediction.findMany({
      where: {
        fixtureId: { in: fixtureIds },
      },
      select: {
        fixtureId: true,
        userId: true,
        homeScore: true,
        awayScore: true,
      },
    })
    : [];

  const predictionsByFixtureId = new Map<string, ScorePrediction[]>();
  const marketPredictions = filterOutCurrentUserPredictions(predictionsByFixture, playerId);
  marketPredictions.forEach((prediction) => {
    const current = predictionsByFixtureId.get(prediction.fixtureId) ?? [];
    current.push({ homeScore: prediction.homeScore, awayScore: prediction.awayScore });
    predictionsByFixtureId.set(prediction.fixtureId, current);
  });

  return NextResponse.json({
    competitions: competitions.map((competition) => {
      const total = competition.fixtures.length;
      const predicted = competition.fixtures.filter((fixture) => fixture.predictions.length > 0).length;
      return {
        id: competition.id,
        name: competition.name,
        code: competition.code,
        totalMatches: total,
        predictedMatches: predicted,
        remainingMatches: Math.max(total - predicted, 0),
      };
    }),
    activeCompetitionId,
    fixtures: fixtures.map((fixture) => {
      const savedPrediction = fixture.predictions[0] ?? null;
      const isResolved = fixture.fixtureState === FixtureState.SETTLED;
      const isLocked = fixture.fixtureState !== FixtureState.SCHEDULED;

      let state: 'open' | 'saved' | 'locked' | 'resolved' = 'open';
      if (isResolved) state = 'resolved';
      else if (isLocked) state = 'locked';
      else if (savedPrediction) state = 'saved';

      return {
        id: fixture.id,
        competitionId: fixture.competitionId,
        home: fixture.homeTeam.name,
        homeLogoUrl: getTeamLogoUrl(fixture.homeTeam),
        away: fixture.awayTeam.name,
        awayLogoUrl: getTeamLogoUrl(fixture.awayTeam),
        kickoff: fixture.utcKickoff,
        competition: fixture.competition?.name ?? 'League Match',
        state,
        points: savedPrediction?.pointsAwarded ?? 0,
        odds: calculateMatchOdds(predictionsByFixtureId.get(fixture.id) ?? []),
        savedPrediction: savedPrediction
          ? { homeScore: savedPrediction.homeScore, awayScore: savedPrediction.awayScore }
          : null,
        finalScore: isResolved && fixture.homeScore !== null && fixture.awayScore !== null
          ? { homeScore: fixture.homeScore, awayScore: fixture.awayScore }
          : null,
      };
    }),
  });
}
