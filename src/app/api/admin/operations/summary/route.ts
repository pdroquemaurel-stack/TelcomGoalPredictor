import { FixtureState } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) return apiError('FORBIDDEN', 'Admin role required.', 403);

  const [
    competitions,
    fixtures,
    visibleFixtures,
    liveFixtures,
    finishedFixtures,
    finishedWithoutScore,
    unsettledFinished,
    users,
    predictions,
    badges,
    dailyCompetitions,
    activeChallenges,
    problematicFixtures,
    lastSync,
  ] = await Promise.all([
    prisma.competition.count(),
    prisma.fixture.count(),
    prisma.fixture.count({ where: { visible: true } }),
    prisma.fixture.count({ where: { fixtureState: FixtureState.LIVE } }),
    prisma.fixture.count({ where: { fixtureState: { in: [FixtureState.FINISHED, FixtureState.SETTLED] } } }),
    prisma.fixture.count({ where: { fixtureState: { in: [FixtureState.FINISHED, FixtureState.SETTLED] }, OR: [{ homeScore: null }, { awayScore: null }] } }),
    prisma.fixture.count({ where: { fixtureState: FixtureState.FINISHED, homeScore: { not: null }, awayScore: { not: null } } }),
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.badge.count(),
    prisma.competition.count({ where: { isDailyEnabled: true, active: true } }),
    prisma.challenge.count({ where: { isActive: true } }),
    prisma.fixture.findMany({
      where: {
        OR: [
          { fixtureState: FixtureState.FINISHED, homeScore: null },
          { fixtureState: FixtureState.FINISHED, awayScore: null },
          { visible: false, predictionEnabled: true },
        ],
      },
      include: { homeTeam: true, awayTeam: true, competition: true },
      take: 8,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.auditLog.findFirst({ where: { action: 'ADMIN_SYNC_SUCCESS' }, orderBy: { createdAt: 'desc' } }),
  ]);

  return apiSuccess({
    competitions,
    fixtures,
    visibleFixtures,
    liveFixtures,
    finishedFixtures,
    finishedWithoutScore,
    unsettledFinished,
    users,
    predictions,
    badges,
    dailyCompetitions,
    activeChallenges,
    lastSyncAt: lastSync?.createdAt ?? null,
    problematicFixtures: problematicFixtures.map((fixture) => ({
      id: fixture.id,
      match: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
      competition: fixture.competition.name,
      state: fixture.fixtureState,
      visible: fixture.visible,
      predictionEnabled: fixture.predictionEnabled,
      hasScore: fixture.homeScore !== null && fixture.awayScore !== null,
    })),
  });
}
