import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  code: z.string().min(4),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return apiError('UNAUTHORIZED', 'Authentication required.', 401);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invitation invalide.', 400, parsed.error.flatten());

  const inviter = await prisma.user.findUnique({
    where: { friendCode: parsed.data.code },
    select: { id: true, profile: { select: { displayName: true } } },
  });

  if (!inviter) return apiError('NOT_FOUND', 'Invitation introuvable.', 404);
  if (inviter.id === userId) return apiError('VALIDATION_ERROR', 'Invitation invalide.', 400);

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: inviter.id, addresseeId: userId },
        { requesterId: userId, addresseeId: inviter.id },
      ],
    },
  });

  if (existing?.status === 'ACCEPTED') {
    return apiSuccess({ status: 'already_friends', inviterName: inviter.profile?.displayName ?? 'Ami' });
  }

  if (existing?.status === 'PENDING') {
    const accepted = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: 'ACCEPTED' },
    });
    return apiSuccess({ status: 'accepted', inviterName: inviter.profile?.displayName ?? 'Ami', friendshipId: accepted.id });
  }

  const accepted = await prisma.friendship.create({
    data: {
      requesterId: inviter.id,
      addresseeId: userId,
      status: 'ACCEPTED',
    },
  });

  return apiSuccess({ status: 'accepted', inviterName: inviter.profile?.displayName ?? 'Ami', friendshipId: accepted.id });
}
