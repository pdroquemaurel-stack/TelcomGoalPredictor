import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { createOrAcceptFriendship } from '@/lib/services/friendship-service';

const schema = z.object({ inviterId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return apiError('UNAUTHORIZED', 'Authentication required.', 401);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Inviter invalide.', 400, parsed.error.flatten());

  const result = await createOrAcceptFriendship(parsed.data.inviterId, userId);
  return apiSuccess(result);
}
