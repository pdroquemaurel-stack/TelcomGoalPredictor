import { LeaderboardPeriod, LeaderboardScope, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function rebuildLeaderboards(
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
  prismaClient: PrismaClient = prisma,
) {
  const profiles = await prismaClient.profile.findMany({
    include: { user: { select: { createdAt: true } } },
    orderBy: [{ totalPoints: 'desc' }, { exactHits: 'desc' }, { user: { createdAt: 'asc' } }],
  });

  await prismaClient.$transaction([
    prismaClient.leaderboardSnapshot.deleteMany({ where: { scope, period } }),
    prismaClient.leaderboardSnapshot.createMany({
      data: profiles.map((profile, index) => ({
        userId: profile.userId,
        scope,
        period,
        rank: index + 1,
        points: profile.totalPoints,
        streak: profile.currentStreak,
      })),
    }),
  ]);

  return { totalRows: profiles.length };
}
