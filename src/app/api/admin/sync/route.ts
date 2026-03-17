import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncCompetitions, syncFixtures } from '@/lib/sync';
import { settleFinishedFixtures } from '@/lib/services/settlement-service';
import { apiError, apiSuccess } from '@/lib/api';
import { buildAdminSyncWindow } from '@/lib/admin-sync-window';
import { prisma } from '@/lib/prisma';
import { type AdminSyncStep, formatAdminSyncError, validateAdminSyncConfig } from '@/lib/admin-sync-diagnostics';

export async function POST() {
  let currentStep: AdminSyncStep = 'auth';
  let actorUserId: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    actorUserId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) {
      return apiError('FORBIDDEN', 'Admin role required.', 403);
    }

    currentStep = 'config';
    const configError = validateAdminSyncConfig();
    if (configError) {
      const formatted = formatAdminSyncError(currentStep, configError);
      return apiError('VALIDATION_ERROR', formatted.message, 500, formatted.details);
    }

    const { from, to } = buildAdminSyncWindow();

    currentStep = 'syncCompetitions';
    const competitions = await syncCompetitions();

    currentStep = 'syncFixtures';
    const fixtures = await syncFixtures(from, to);

    currentStep = 'settleFinishedFixtures';
    const settlement = await settleFinishedFixtures();

    const syncResult = {
      success: true,
      from,
      to,
      competitionsSynced: competitions.syncedCount,
      competitionsFetched: competitions.totalFetched,
      fixturesCreated: fixtures.created,
      fixturesUpdated: fixtures.updated,
      fixturesSkipped: fixtures.skipped,
      fixturesFetched: fixtures.totalFetched,
      fixturesProcessed: fixtures.totalProcessed,
      settlement,
      errors: fixtures.errors,
    };

    console.info('[admin-sync] sync completed', {
      from,
      to,
      competitionsSynced: syncResult.competitionsSynced,
      fixturesFetched: syncResult.fixturesFetched,
      fixturesProcessed: syncResult.fixturesProcessed,
      fixturesSkipped: syncResult.fixturesSkipped,
      settledFixturesCount: settlement.settledFixturesCount,
      updatedPredictionsCount: settlement.updatedPredictionsCount,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action: 'ADMIN_SYNC_SUCCESS',
        targetType: 'SYNC',
        metadata: syncResult,
      },
    });

    return apiSuccess(syncResult);
  } catch (error) {
    const formatted = formatAdminSyncError(currentStep, error);

    if (actorUserId) {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          action: 'ADMIN_SYNC_FAILURE',
          targetType: 'SYNC',
          metadata: { step: currentStep, message: formatted.message, details: formatted.details },
        },
      });
    }

    console.error('[admin-sync] sync failed', {
      step: currentStep,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return apiError('EXTERNAL_PROVIDER_ERROR', formatted.message, 500, formatted.details);
  }
}
