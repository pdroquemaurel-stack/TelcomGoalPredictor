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

export async function GET() {
  const now = new Date();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const fixtures = await prisma.fixture.findMany({
    where: { predictionEnabled: true, visible: true },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      ...(userId ? { predictions: { where: { userId }, take: 1 } } : {}),
    },
    orderBy: [{ utcKickoff: 'asc' }],
    take: 30,
  });

  return NextResponse.json({
    fixtures: fixtures.map((f) => {
      const savedPrediction = userId && 'predictions' in f ? f.predictions[0] : null;
      const locked = now >= f.utcKickoff;
      const resolved = f.homeScore !== null && f.awayScore !== null;

      let state: 'open' | 'saved' | 'locked' | 'resolved' = 'open';
      if (resolved) state = 'resolved';
      else if (locked) state = 'locked';
      else if (savedPrediction) state = 'saved';

      let resultStatus: 'won' | 'lost' | 'pending' | null = null;
      if (savedPrediction) {
        if (!resolved) {
          resultStatus = 'pending';
        } else {
          const predicted = matchResult(savedPrediction.homeScore, savedPrediction.awayScore);
          const actual = matchResult(f.homeScore ?? 0, f.awayScore ?? 0);
          resultStatus = predicted === actual ? 'won' : 'lost';
        }
      }

      return {
        id: f.id,
        home: f.homeTeam.name,
        away: f.awayTeam.name,
        kickoff: f.utcKickoff,
        competition: f.competition?.name ?? 'League Match',
        state,
        savedPrediction: savedPrediction
          ? { homeScore: savedPrediction.homeScore, awayScore: savedPrediction.awayScore }
          : null,
        finalScore: resolved ? { homeScore: f.homeScore, awayScore: f.awayScore } : null,
        resultStatus,
      };
    }),
  });
}
