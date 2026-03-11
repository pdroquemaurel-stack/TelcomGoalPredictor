import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  const now = new Date();
  const fixtures = await prisma.fixture.findMany({
    where: { predictionEnabled: true, visible: true, utcKickoff: { gt: now } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { utcKickoff: 'asc' },
    take: 20,
  });

  return NextResponse.json({ fixtures: fixtures.map((f) => ({ id: f.id, home: f.homeTeam.name, away: f.awayTeam.name, kickoff: f.utcKickoff, state: 'open' })) });
}
