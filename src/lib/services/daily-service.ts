import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getTeamLogoUrl } from '@/lib/team-logo';
import { APP_CONFIG_DEFAULTS, getAppConfig } from '@/lib/app-config';
import { buildDailyBounds, normalizeDailyConfig } from '@/lib/admin-config-helpers';

function dayRange(offsetDays = 0, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function isFixtureInDailyWindow(
  kickoff: Date,
  now = new Date(),
  options?: { futureDays?: number; pastDays?: number },
) {
  const bounds = buildDailyBounds(now, {
    dailyPastDays: options?.pastDays ?? APP_CONFIG_DEFAULTS.dailyPastDays,
    dailyFutureDays: options?.futureDays ?? APP_CONFIG_DEFAULTS.dailyFutureDays,
  });

  return kickoff >= bounds.start && kickoff < bounds.end;
}

export async function getDailyFixturesForUser(userId: string) {
  const config = await getAppConfig();
  const now = new Date();
  const normalizedDaily = normalizeDailyConfig(config);
  const bounds = buildDailyBounds(now, normalizedDaily);
  const startRange = bounds.start;
  const endRange = bounds.end;
  const allowedStates: FixtureState[] = config.includeLiveFixturesInDaily
    ? [FixtureState.SCHEDULED, FixtureState.LIVE]
    : [FixtureState.SCHEDULED];

  const dailyCompetitionFilter = config.dailyAutoUseEnabledCompetitions
    ? { isDailyEnabled: true }
    : undefined;

  const fixtures = await prisma.fixture.findMany({
    where: {
      visible: true,
      predictionEnabled: true,
      fixtureState: { in: allowedStates },
      competition: {
        visible: true,
        active: true,
        ...(dailyCompetitionFilter ?? {}),
      },
      ...(config.featuredCompetitionId
        ? {
          OR: [
            { competitionId: config.featuredCompetitionId },
            ...(dailyCompetitionFilter ? [{ competition: dailyCompetitionFilter }] : []),
          ],
        }
        : {}),
      utcKickoff: { gte: startRange, lt: endRange },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      competition: true,
      predictions: { where: { userId }, take: 1 },
    },
    orderBy: [{ featured: 'desc' }, { utcKickoff: 'asc' }],
    take: Math.max(1, config.maxDailyFixtures),
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

  const today = dayRange(0, now);
  const tomorrow = dayRange(1, now);

  return {
    today: fixtures.filter((f) => f.utcKickoff >= today.start && f.utcKickoff < today.end).map(toUi),
    tomorrow: fixtures.filter((f) => f.utcKickoff >= tomorrow.start && f.utcKickoff < tomorrow.end).map(toUi),
  };
}
