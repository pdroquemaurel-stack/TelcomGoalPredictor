import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { footballProvider } from '@/lib/football';
import { isFixtureFinished } from '@/lib/scoring';

export type CompetitionSyncResult = {
  syncedCount: number;
  totalFetched: number;
};

export type FixtureSyncResult = {
  created: number;
  updated: number;
  skipped: number;
  totalFetched: number;
  totalProcessed: number;
  errors: string[];
};

export function mapFixtureState(statusText: string, homeScore?: number | null, awayScore?: number | null) {
  if (isFixtureFinished(statusText, homeScore ?? null, awayScore ?? null)) {
    return { fixtureState: FixtureState.FINISHED, predictionEnabled: false };
  }

  const normalizedStatus = statusText.toUpperCase();
  if (['IN_PLAY', 'LIVE', 'PAUSED', 'HT'].includes(normalizedStatus)) {
    return { fixtureState: FixtureState.LIVE, predictionEnabled: false };
  }

  return { fixtureState: FixtureState.SCHEDULED, predictionEnabled: true };
}

export function mergeFixtureScores(
  existing: { homeScore: number | null; awayScore: number | null },
  incoming: { homeScore?: number | null; awayScore?: number | null },
) {
  return {
    homeScore: incoming.homeScore ?? existing.homeScore,
    awayScore: incoming.awayScore ?? existing.awayScore,
  };
}

export async function syncCompetitions() {
  const provider = footballProvider();
  const competitions = await provider.getCompetitions();
  let syncedCount = 0;

  for (const competitionData of competitions) {
    syncedCount += 1;
    await prisma.competition.upsert({
      where: { externalId: competitionData.externalId },
      create: {
        externalId: competitionData.externalId,
        code: competitionData.code,
        name: competitionData.name,
        country: competitionData.country,
      },
      update: {
        code: competitionData.code,
        name: competitionData.name,
        country: competitionData.country,
      },
    });
  }

  return { syncedCount, totalFetched: competitions.length } satisfies CompetitionSyncResult;
}

export async function syncFixtures(from: string, to: string) {
  const provider = footballProvider();
  const fixtures = await provider.getFixtures({ from, to });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const fixtureData of fixtures) {
    try {
      if (!fixtureData.competitionExternalId || fixtureData.competitionExternalId === 'undefined') {
        skipped += 1;
        errors.push(`Fixture ${fixtureData.externalId}: missing competition id from provider.`);
        continue;
      }

      const competition = await prisma.competition.findUnique({ where: { externalId: fixtureData.competitionExternalId } });
      if (!competition) {
        skipped += 1;
        errors.push(`Fixture ${fixtureData.externalId}: competition ${fixtureData.competitionExternalId} not found locally.`);
        continue;
      }

      const homeTeam = await prisma.team.upsert({
        where: { externalId: fixtureData.homeTeamExternalId },
        create: {
          externalId: fixtureData.homeTeamExternalId,
          name: fixtureData.homeTeamName,
          shortName: fixtureData.homeTeamShortName ?? null,
          crestUrl: fixtureData.homeTeamCrest ?? null,
        },
        update: {
          name: fixtureData.homeTeamName,
          shortName: fixtureData.homeTeamShortName ?? null,
          crestUrl: fixtureData.homeTeamCrest ?? null,
        },
      });

      const awayTeam = await prisma.team.upsert({
        where: { externalId: fixtureData.awayTeamExternalId },
        create: {
          externalId: fixtureData.awayTeamExternalId,
          name: fixtureData.awayTeamName,
          shortName: fixtureData.awayTeamShortName ?? null,
          crestUrl: fixtureData.awayTeamCrest ?? null,
        },
        update: {
          name: fixtureData.awayTeamName,
          shortName: fixtureData.awayTeamShortName ?? null,
          crestUrl: fixtureData.awayTeamCrest ?? null,
        },
      });

      const existing = await prisma.fixture.findUnique({
        where: { externalId: fixtureData.externalId },
        select: { id: true, homeScore: true, awayScore: true, fixtureState: true },
      });

      const mergedScores = mergeFixtureScores(
        { homeScore: existing?.homeScore ?? null, awayScore: existing?.awayScore ?? null },
        { homeScore: fixtureData.homeScore, awayScore: fixtureData.awayScore },
      );

      const { fixtureState, predictionEnabled } = mapFixtureState(
        fixtureData.statusText,
        mergedScores.homeScore,
        mergedScores.awayScore,
      );

      const nextFixtureState = existing?.fixtureState === FixtureState.SETTLED ? FixtureState.SETTLED : fixtureState;

      if (existing) updated += 1;
      else created += 1;

      await prisma.fixture.upsert({
        where: { externalId: fixtureData.externalId },
        create: {
          externalId: fixtureData.externalId,
          competitionId: competition.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          utcKickoff: new Date(fixtureData.utcKickoff),
          statusText: fixtureData.statusText,
          fixtureState,
          predictionEnabled,
          homeScore: mergedScores.homeScore,
          awayScore: mergedScores.awayScore,
        },
        update: {
          statusText: fixtureData.statusText,
          fixtureState: nextFixtureState,
          predictionEnabled: nextFixtureState === FixtureState.SETTLED ? false : predictionEnabled,
          utcKickoff: new Date(fixtureData.utcKickoff),
          homeScore: mergedScores.homeScore,
          awayScore: mergedScores.awayScore,
        },
      });
    } catch (error) {
      skipped += 1;
      errors.push(`Fixture ${fixtureData.externalId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    created,
    updated,
    skipped,
    totalFetched: fixtures.length,
    totalProcessed: created + updated,
    errors,
  } satisfies FixtureSyncResult;
}
