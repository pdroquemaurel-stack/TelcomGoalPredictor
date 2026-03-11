import { LeaderboardPeriod, LeaderboardScope } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function rebuildLeaderboards(scope: LeaderboardScope, period: LeaderboardPeriod) {
  const users = await prisma.profile.findMany({ include: { user: true }, orderBy: { totalPoints: 'desc' } });
  await prisma.leaderboardSnapshot.createMany({
    data: users.map((u, idx) => ({ userId: u.userId, scope, period, rank: idx + 1, points: u.totalPoints, streak: u.currentStreak })),
  });
}
