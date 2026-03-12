import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { footballProvider } from '@/lib/football';
import { isFixtureFinished } from '@/lib/scoring';

function mapFixtureState(statusText: string, homeScore?: number, awayScore?: number) {
  if (isFixtureFinished(statusText, homeScore ?? null, awayScore ?? null)) {
    return { fixtureState: FixtureState.FINISHED, predictionEnabled: false };
  }

  const normalizedStatus = statusText.toUpperCase();
  if (['IN_PLAY', 'LIVE', 'PAUSED', 'HT'].includes(normalizedStatus)) {
    return { fixtureState: FixtureState.LIVE, predictionEnabled: false };
  }

  return { fixtureState: FixtureState.SCHEDULED, predictionEnabled: true };
}

export async function syncCompetitions() {
  const provider = footballProvider();
  const competitions = await provider.getCompetitions();
  for (const competitionData of competitions) {
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
}

export async function syncFixtures(from: string, to: string) {
  const provider = footballProvider();
  const fixtures = await provider.getFixtures({ from, to });

  for (const fixtureData of fixtures) {
    const competition = await prisma.competition.findUnique({ where: { externalId: fixtureData.competitionExternalId } });
    if (!competition) continue;

    const homeTeam = await prisma.team.upsert({
      where: { externalId: fixtureData.homeTeamExternalId },
      create: { externalId: fixtureData.homeTeamExternalId, name: `Team ${fixtureData.homeTeamExternalId}` },
      update: {},
    });

    const awayTeam = await prisma.team.upsert({
      where: { externalId: fixtureData.awayTeamExternalId },
      create: { externalId: fixtureData.awayTeamExternalId, name: `Team ${fixtureData.awayTeamExternalId}` },
      update: {},
    });

    const { fixtureState, predictionEnabled } = mapFixtureState(
      fixtureData.statusText,
      fixtureData.homeScore,
      fixtureData.awayScore,
    );

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
        homeScore: fixtureData.homeScore,
        awayScore: fixtureData.awayScore,
      },
      update: {
        statusText: fixtureData.statusText,
        fixtureState,
        predictionEnabled,
        utcKickoff: new Date(fixtureData.utcKickoff),
        homeScore: fixtureData.homeScore,
        awayScore: fixtureData.awayScore,
      },
    });
  }
}
