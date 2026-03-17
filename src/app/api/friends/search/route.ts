import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/session-user';

export async function GET(request: Request) {
  const me = await getAuthenticatedUser();
  if (!me?.id) {
    return NextResponse.json({ error: { message: 'Connexion requise.' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = (searchParams.get('username') ?? '').trim();
  if (!username) {
    return NextResponse.json({ error: { message: 'Pseudo manquant.' } }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true },
  });

  if (!user || user.id === me.id) {
    return NextResponse.json({ data: null });
  }

  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: user.id },
        { requesterId: user.id, addresseeId: me.id },
      ],
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });

  if (existingFriendship) {
    return NextResponse.json({ error: { message: 'Ce joueur est déjà dans vos relations.' } }, { status: 409 });
  }

  return NextResponse.json({
    data: {
      username: user.username,
      displayName: user.profile?.displayName ?? user.username,
    },
  });
}
