import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureState } from '@prisma/client';
import { syncCompetitions, syncFixtures } from '@/lib/sync';

function createSyncMockPrisma() {
  const competitions = new Map<string, any>();
  const teams = new Map<string, any>();
  const fixtures = new Map<string, any>();

  return {
    competition: {
      upsert: async ({ where, create, update }: any) => {
        const existing = competitions.get(where.externalId);
        const row = existing ? { ...existing, ...update } : { id: `c-${where.externalId}`, ...create };
        competitions.set(where.externalId, row);
        return row;
      },
      findUnique: async ({ where }: any) => competitions.get(where.externalId) ?? null,
    },
    team: {
      upsert: async ({ where, create, update }: any) => {
        const existing = teams.get(where.externalId);
        const row = existing ? { ...existing, ...update } : { id: `t-${where.externalId}`, ...create };
        teams.set(where.externalId, row);
        return row;
      },
    },
    fixture: {
      findUnique: async ({ where }: any) => {
        const row = fixtures.get(where.externalId);
        if (!row) return null;
        return { id: row.id, homeScore: row.homeScore, awayScore: row.awayScore, fixtureState: row.fixtureState };
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = fixtures.get(where.externalId);
        const row = existing ? { ...existing, ...update } : { id: `f-${where.externalId}`, ...create };
        fixtures.set(where.externalId, row);
        return row;
      },
    },
    __getFixture: (externalId: string) => fixtures.get(externalId),
    __fixtureCount: () => fixtures.size,
  } as any;
}

const provider = {
  getCompetitions: async () => ([{ externalId: '2001', code: 'WCQ', name: 'CAF Qualifiers', country: 'Africa' }]),
  getFixtures: async () => ([{
    externalId: 'fx-100',
    competitionExternalId: '2001',
    homeTeamExternalId: '10',
    homeTeamName: 'Team A',
    awayTeamExternalId: '20',
    awayTeamName: 'Team B',
    utcKickoff: '2026-01-10T12:00:00Z',
    statusText: 'FINISHED',
    homeScore: 2,
    awayScore: 1,
  }]),
};

test('sync admin nominale: compétitions + fixtures cohérentes', async () => {
  const prisma = createSyncMockPrisma();

  const competitions = await syncCompetitions({ provider, prismaClient: prisma });
  const fixtures = await syncFixtures('2026-01-01', '2026-01-31', { provider, prismaClient: prisma });

  assert.equal(competitions.syncedCount, 1);
  assert.equal(fixtures.created, 1);
  assert.equal(fixtures.updated, 0);
  assert.equal(fixtures.skipped, 0);
  assert.equal(prisma.__fixtureCount(), 1);
  assert.equal(prisma.__getFixture('fx-100').fixtureState, FixtureState.FINISHED);
});

test('sync répétée: pas de doublon et état stable', async () => {
  const prisma = createSyncMockPrisma();

  await syncCompetitions({ provider, prismaClient: prisma });
  await syncFixtures('2026-01-01', '2026-01-31', { provider, prismaClient: prisma });
  const secondRun = await syncFixtures('2026-01-01', '2026-01-31', { provider, prismaClient: prisma });

  assert.equal(secondRun.created, 0);
  assert.equal(secondRun.updated, 1);
  assert.equal(secondRun.skipped, 0);
  assert.equal(prisma.__fixtureCount(), 1);
  assert.equal(prisma.__getFixture('fx-100').predictionEnabled, false);
});
