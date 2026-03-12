import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { FixtureState } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get('competitionId');

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const playerId = userId ?? fallbackUser?.id ?? '';

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
        away: fixture.awayTeam.name,
        kickoff: fixture.utcKickoff,
        competition: fixture.competition?.name ?? 'League Match',
        state,
        points: savedPrediction?.pointsAwarded ?? 0,
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
