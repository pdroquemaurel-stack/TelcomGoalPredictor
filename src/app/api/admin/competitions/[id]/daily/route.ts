export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';

const schema = z.object({ isDailyEnabled: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) return apiError('FORBIDDEN', 'Admin role required.', 403);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid payload.', 400, parsed.error.flatten());

  const competition = await prisma.competition.update({
    where: { id: params.id },
    data: { isDailyEnabled: parsed.data.isDailyEnabled },
  });

  return apiSuccess({ id: competition.id, isDailyEnabled: competition.isDailyEnabled });
}
