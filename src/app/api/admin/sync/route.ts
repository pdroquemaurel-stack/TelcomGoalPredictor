import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncCompetitions, syncFixtures } from '@/lib/sync';
import { settleFinishedFixtures } from '@/lib/services/settlement-service';
import { apiError, apiSuccess } from '@/lib/api';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) {
      return apiError('FORBIDDEN', 'Admin role required.', 403);
    }

    const now = new Date();
    const from = now.toISOString().slice(0, 10);
    const to = new Date(now.getTime() + 10 * 86400000).toISOString().slice(0, 10);

    const competitions = await syncCompetitions();
    const fixtures = await syncFixtures(from, to);
    const settlement = await settleFinishedFixtures();

    return apiSuccess({
      from,
      to,
      competitionsSynced: competitions.syncedCount,
      fixturesCreated: fixtures.created,
      fixturesUpdated: fixtures.updated,
      fixturesFetched: fixtures.totalFetched,
      settlement,
    });
  } catch (error) {
    return apiError('EXTERNAL_PROVIDER_ERROR', 'Fixture sync failed.', 500, error instanceof Error ? error.message : error);
  }
}
