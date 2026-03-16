import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncCompetitions, syncFixtures } from '@/lib/sync';
import { settleFinishedFixtures } from '@/lib/services/settlement-service';
import { apiError, apiSuccess } from '@/lib/api';
import { buildAdminSyncWindow } from '@/lib/admin-sync-window';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) {
      return apiError('FORBIDDEN', 'Admin role required.', 403);
    }

    const { from, to } = buildAdminSyncWindow();

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
