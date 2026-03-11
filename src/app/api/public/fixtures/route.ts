import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    orderBy: { utcKickoff: 'asc' },
    take: 20,
  });

  return NextResponse.json({
    fixtures: fixtures.map((f) => {
      const locked = now >= f.utcKickoff;
      const savedPrediction = userId && 'predictions' in f ? f.predictions[0] : null;

      return {
        id: f.id,
        home: f.homeTeam.name,
        away: f.awayTeam.name,
        kickoff: f.utcKickoff,
        competition: f.competition?.name ?? 'League Match',
        state: locked ? 'locked' : savedPrediction ? 'saved' : 'open',
        savedPrediction: savedPrediction
          ? { homeScore: savedPrediction.homeScore, awayScore: savedPrediction.awayScore }
          : null,
      };
    }),
  });
}
