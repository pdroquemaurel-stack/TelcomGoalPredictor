import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/session-user';

export async function POST(request: Request) {
  const me = await getAuthenticatedUser();
  if (!me?.id) {
    return NextResponse.json({ error: { message: 'Connexion requise.' } }, { status: 401 });
  }

  const body = await request.json() as { username?: string };
  const username = (body.username ?? '').trim();
  if (!username) {
    return NextResponse.json({ error: { message: 'Pseudo manquant.' } }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target || target.id === me.id) {
    return NextResponse.json({ error: { message: 'Joueur introuvable.' } }, { status: 404 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: me.id },
      ],
    },
  });

  if (existing) {
    await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'ACCEPTED' } });
  } else {
    await prisma.friendship.create({
      data: {
        requesterId: me.id,
        addresseeId: target.id,
        status: 'ACCEPTED',
      },
    });
  }

  return NextResponse.json({ data: { ok: true } });
}
