export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { getChallengeLeaderboard } from '@/lib/services/challenge-service';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const challenge = await prisma.challenge.findUnique({ where: { slug: params.slug }, select: { id: true, name: true } });
  if (!challenge) return apiError('NOT_FOUND', 'Challenge not found.', 404);

  const leaderboard = await getChallengeLeaderboard(challenge.id);
  return apiSuccess({ challengeName: challenge.name, leaderboard });
}
