import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  username: z.string().trim().min(2).max(40),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return apiError('UNAUTHORIZED', 'Authentication required.', 401);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Pseudo invalide.', 400, parsed.error.flatten());

  const username = parsed.data.username;

  const profile = await prisma.profile.findFirst({
    where: { displayName: { equals: username, mode: 'insensitive' } },
    select: { userId: true, displayName: true },
  });

  if (!profile) return apiError('NOT_FOUND', 'Aucun joueur trouvé avec ce pseudo.', 404);
  if (profile.userId === userId) return apiError('VALIDATION_ERROR', 'Vous ne pouvez pas vous inviter.', 400);

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: profile.userId },
        { requesterId: profile.userId, addresseeId: userId },
      ],
    },
  });

  if (existing?.status === 'ACCEPTED') return apiSuccess({ status: 'already_friends', displayName: profile.displayName });
  if (existing?.status === 'PENDING') return apiSuccess({ status: 'pending', displayName: profile.displayName });

  await prisma.friendship.create({
    data: {
      requesterId: userId,
      addresseeId: profile.userId,
      status: 'PENDING',
    },
  });

  return apiSuccess({ status: 'sent', displayName: profile.displayName });
}
