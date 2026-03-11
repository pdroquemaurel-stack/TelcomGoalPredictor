import { prisma } from '@/lib/prisma';
import { footballProvider } from '@/lib/football';

export async function syncCompetitions() {
  const provider = footballProvider();
  const competitions = await provider.getCompetitions();
  for (const c of competitions) {
    await prisma.competition.upsert({
      where: { externalId: c.externalId },
      create: { externalId: c.externalId, code: c.code, name: c.name, country: c.country },
      update: { code: c.code, name: c.name, country: c.country },
    });
  }
}

export async function syncFixtures(from: string, to: string) {
  const provider = footballProvider();
  const fixtures = await provider.getFixtures({ from, to });
  for (const f of fixtures) {
    const competition = await prisma.competition.findUnique({ where: { externalId: f.competitionExternalId } });
    const home = await prisma.team.upsert({ where: { externalId: f.homeTeamExternalId }, create: { externalId: f.homeTeamExternalId, name: `Team ${f.homeTeamExternalId}` }, update: {} });
    const away = await prisma.team.upsert({ where: { externalId: f.awayTeamExternalId }, create: { externalId: f.awayTeamExternalId, name: `Team ${f.awayTeamExternalId}` }, update: {} });
    if (!competition) continue;
    await prisma.fixture.upsert({
      where: { externalId: f.externalId },
      create: {
        externalId: f.externalId,
        competitionId: competition.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        utcKickoff: new Date(f.utcKickoff),
        statusText: f.statusText,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
      },
      update: {
        statusText: f.statusText,
        utcKickoff: new Date(f.utcKickoff),
        homeScore: f.homeScore,
        awayScore: f.awayScore,
      },
    });
  }
}
