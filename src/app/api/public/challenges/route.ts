export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';

export async function GET() {
  const now = new Date();
  const challenges = await prisma.challenge.findMany({
    where: getActiveChallengesFilter(now),
    include: { competition: true, _count: { select: { fixtures: true } } },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
  });

  return apiSuccess(
    challenges.map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      slug: challenge.slug,
      description: challenge.description,
      reward: challenge.reward,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      competition: challenge.competition.name,
      fixturesCount: challenge._count.fixtures,
    })),
  );
}
