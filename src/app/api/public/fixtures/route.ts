import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function matchResult(home: number, away: number) {
  if (home > away) return 'HOME';
  if (home < away) return 'AWAY';
  return 'DRAW';
}

export async function GET(req: Request) {
  const now = new Date();
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
    fixtures: fixtures.map((f) => {
      const savedPrediction = f.predictions[0] ?? null;
      const locked = now >= f.utcKickoff;
      const resolved = f.homeScore !== null && f.awayScore !== null;

      let state: 'open' | 'saved' | 'locked' | 'resolved' = 'open';
      if (resolved) state = 'resolved';
      else if (locked) state = 'locked';
      else if (savedPrediction) state = 'saved';

      let resultStatus: 'won' | 'lost' | 'pending' | null = null;
      let points = 0;
      if (savedPrediction) {
        if (!resolved) {
          resultStatus = 'pending';
        } else {
          const exact = savedPrediction.homeScore === f.homeScore && savedPrediction.awayScore === f.awayScore;
          const predicted = matchResult(savedPrediction.homeScore, savedPrediction.awayScore);
          const actual = matchResult(f.homeScore ?? 0, f.awayScore ?? 0);
          points = exact ? 3 : predicted === actual ? 1 : 0;
          resultStatus = points > 0 ? 'won' : 'lost';
        }
      }

      return {
        id: f.id,
        competitionId: f.competitionId,
        home: f.homeTeam.name,
        away: f.awayTeam.name,
        kickoff: f.utcKickoff,
        competition: f.competition?.name ?? 'League Match',
        state,
        points,
        savedPrediction: savedPrediction
          ? { homeScore: savedPrediction.homeScore, awayScore: savedPrediction.awayScore }
          : null,
        finalScore: resolved ? { homeScore: f.homeScore, awayScore: f.awayScore } : null,
        resultStatus,
      };
    }),
  });
}
