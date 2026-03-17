import type { FixtureSyncResult } from '@/lib/sync';
import type { settleFinishedFixtures } from '@/lib/services/settlement-service';

export type SettlementSyncResult = Awaited<ReturnType<typeof settleFinishedFixtures>>;

export type AdminSyncResult = {
  success: true;
  from: string;
  to: string;
  competitionsSynced: number;
  competitionsFetched: number;
  fixturesCreated: FixtureSyncResult['created'];
  fixturesUpdated: FixtureSyncResult['updated'];
  fixturesSkipped: FixtureSyncResult['skipped'];
  fixturesFetched: FixtureSyncResult['totalFetched'];
  fixturesProcessed: FixtureSyncResult['totalProcessed'];
  settlement: SettlementSyncResult;
  errors: FixtureSyncResult['errors'];
};
