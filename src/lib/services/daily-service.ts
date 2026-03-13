import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getTeamLogoUrl } from '@/lib/team-logo';

function dayRange(offsetDays = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}


export function isFixtureInDailyWindow(kickoff: Date, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return kickoff >= start && kickoff < end;
}

export async function getDailyFixturesForUser(userId: string) {
  const today = dayRange(0);
  const tomorrow = dayRange(1);

  const fixtures = await prisma.fixture.findMany({
    where: {
      visible: true,
      predictionEnabled: true,
      fixtureState: FixtureState.SCHEDULED,
      competition: { visible: true, active: true, isDailyEnabled: true },
      utcKickoff: { gte: today.start, lt: tomorrow.end },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      predictions: { where: { userId }, take: 1 },
    },
    orderBy: [{ utcKickoff: 'asc' }],
    take: 200,
  });

  const toUi = (fixture: (typeof fixtures)[number]) => ({
    id: fixture.id,
    kickoff: fixture.utcKickoff,
    competition: fixture.competition.name,
    competitionId: fixture.competitionId,
    home: fixture.homeTeam.name,
    homeLogoUrl: getTeamLogoUrl(fixture.homeTeam),
    away: fixture.awayTeam.name,
    awayLogoUrl: getTeamLogoUrl(fixture.awayTeam),
    state: fixture.predictions.length ? 'saved' : 'open',
    savedPrediction: fixture.predictions[0]
      ? {
          homeScore: fixture.predictions[0].homeScore,
          awayScore: fixture.predictions[0].awayScore,
        }
      : null,
  });

  return {
    today: fixtures.filter((f) => f.utcKickoff >= today.start && f.utcKickoff < today.end).map(toUi),
    tomorrow: fixtures.filter((f) => f.utcKickoff >= tomorrow.start && f.utcKickoff < tomorrow.end).map(toUi),
  };
}
