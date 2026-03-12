export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { ensureChallengeFixtureLinks } from '@/lib/services/challenge-service';

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  competitionId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  reward: z.string().optional().nullable(),
  isActive: z.boolean(),
});

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  return !!session?.user && (role === 'ADMIN' || role === 'EDITOR');
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return apiError('FORBIDDEN', 'Admin role required.', 403);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid challenge payload.', 400, parsed.error.flatten());

  const data = parsed.data;
  const challenge = await prisma.challenge.update({
    where: { id: params.id },
    data: {
      name: data.name,
      slug: data.slug ? slugify(data.slug) : slugify(data.name),
      description: data.description || null,
      competitionId: data.competitionId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reward: data.reward || null,
      isActive: data.isActive,
    },
  });

  await prisma.challengeFixture.deleteMany({ where: { challengeId: challenge.id } });
  await ensureChallengeFixtureLinks(challenge.id);
  return apiSuccess(challenge);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return apiError('FORBIDDEN', 'Admin role required.', 403);
  await prisma.challenge.delete({ where: { id: params.id } });
  return apiSuccess({ deleted: true });
}
