import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ fixtureId: z.string(), homeScore: z.number().min(0).max(20), awayScore: z.number().min(0).max(20) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const fixture = await prisma.fixture.findUnique({ where: { id: parsed.data.fixtureId } });
  if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  if (!fixture.predictionEnabled || new Date() >= fixture.utcKickoff) return NextResponse.json({ error: 'Prediction locked' }, { status: 400 });

  const prediction = await prisma.prediction.upsert({
    where: { userId_fixtureId: { userId: (session.user as any).id, fixtureId: fixture.id } },
    create: { userId: (session.user as any).id, fixtureId: fixture.id, homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
    update: { homeScore: parsed.data.homeScore, awayScore: parsed.data.awayScore },
  });

  return NextResponse.json({ ok: true, prediction });
}
