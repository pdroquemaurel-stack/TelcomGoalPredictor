import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { createOrAcceptFriendship } from '@/lib/services/friendship-service';

const schema = z.object({ username: z.string().min(2).max(50) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return apiError('UNAUTHORIZED', 'Authentication required.', 401);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Nom invalide.', 400, parsed.error.flatten());

  const target = await prisma.profile.findFirst({
    where: { displayName: { equals: parsed.data.username, mode: 'insensitive' } },
    select: { userId: true, displayName: true },
  });

  if (!target) return apiError('NOT_FOUND', 'Utilisateur introuvable.', 404);

  const result = await createOrAcceptFriendship(userId, target.userId);
  return apiSuccess({ ...result, username: target.displayName });
}
