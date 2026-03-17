import { z } from 'zod';
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

const nonNegativeInt = z.number().int().min(0);

export const settlementSyncResultSchema = z.object({
  settledFixturesCount: nonNegativeInt,
  resettledFixturesCount: nonNegativeInt,
  updatedPredictionsCount: nonNegativeInt,
  impactedUsersCount: nonNegativeInt,
});

export const adminSyncResultSchema = z.object({
  success: z.literal(true),
  from: z.string().min(1),
  to: z.string().min(1),
  competitionsSynced: nonNegativeInt,
  competitionsFetched: nonNegativeInt,
  fixturesCreated: nonNegativeInt,
  fixturesUpdated: nonNegativeInt,
  fixturesSkipped: nonNegativeInt,
  fixturesFetched: nonNegativeInt,
  fixturesProcessed: nonNegativeInt,
  settlement: settlementSyncResultSchema,
  errors: z.array(z.string()),
});

export const operationsSummarySchema = z.object({
  competitions: nonNegativeInt,
  fixtures: nonNegativeInt,
  visibleFixtures: nonNegativeInt,
  liveFixtures: nonNegativeInt,
  finishedFixtures: nonNegativeInt,
  finishedWithoutScore: nonNegativeInt,
  unsettledFinished: nonNegativeInt,
  users: nonNegativeInt,
  predictions: nonNegativeInt,
  badges: nonNegativeInt,
  dailyCompetitions: nonNegativeInt,
  activeChallenges: nonNegativeInt,
  lastSyncAt: z.string().datetime().nullable(),
  problematicFixtures: z.array(z.object({
    id: z.string().min(1),
    match: z.string().min(1),
    competition: z.string().min(1),
    state: z.string().min(1),
    visible: z.boolean(),
    predictionEnabled: z.boolean(),
    hasScore: z.boolean(),
  })),
});

export type OperationsSummary = z.infer<typeof operationsSummarySchema>;
