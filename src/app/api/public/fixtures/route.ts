export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
