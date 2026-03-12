export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { getChallengeDetailBySlug } from '@/lib/services/challenge-service';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const playerId = userId ?? fallbackUser?.id ?? '';

  const detail = await getChallengeDetailBySlug(params.slug, playerId);
  if (!detail) return apiError('NOT_FOUND', 'Challenge not found.', 404);
  return apiSuccess(detail);
}
