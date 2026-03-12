import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getTeamLogoUrl } from '@/lib/team-logo';
import { getUpcomingDaysSetting } from '@/lib/services/app-settings';

type Odds = { home: number | null; draw: number | null; away: number | null; sampleSize: number };

function dayStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dayKey(date: Date) {
  return dayStart(date).toISOString().slice(0, 10);
}

function formatDayLabel(target: Date, now: Date) {
  const startNow = dayStart(now);
  const startTarget = dayStart(target);
  const diff = Math.round((startTarget.getTime() - startNow.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(target);
}

function computeOdds(entries: Array<{ homeScore: number; awayScore: number }>): Odds {
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  for (const entry of entries) {
    if (entry.homeScore > entry.awayScore) homeWins += 1;
    else if (entry.homeScore < entry.awayScore) awayWins += 1;
    else draws += 1;
  }

  const total = homeWins + draws + awayWins;
  if (total === 0) return { home: null, draw: null, away: null, sampleSize: 0 };

  const asOdds = (count: number) => {
    if (count === 0) return null;
    return Number((1 / (count / total)).toFixed(2));
  };

  return {
    home: asOdds(homeWins),
    draw: asOdds(draws),
    away: asOdds(awayWins),
    sampleSize: total,
  };
}

export function isFixtureInDailyWindow(kickoff: Date, now = new Date()) {
  const start = dayStart(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return kickoff >= start && kickoff < end;
}

export async function getDailyFixturesForUser(userId: string) {
  const now = new Date();
  const start = dayStart(now);
  const upcomingDays = await getUpcomingDaysSetting();
  const end = new Date(start);
  end.setDate(end.getDate() + upcomingDays);

  const [upcomingFixtures, pastPredictions] = await Promise.all([
    prisma.fixture.findMany({
      where: {
        visible: true,
        predictionEnabled: true,
        fixtureState: FixtureState.SCHEDULED,
        competition: { visible: true, active: true, isDailyEnabled: true },
        utcKickoff: { gte: start, lt: end },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        predictions: { where: { userId }, take: 1 },
      },
      orderBy: [{ utcKickoff: 'asc' }],
      take: 250,
    }),
    prisma.prediction.findMany({
      where: {
        userId,
        fixture: {
          visible: true,
          competition: { visible: true, active: true, isDailyEnabled: true },
          utcKickoff: { lt: now },
          homeScore: { not: null },
          awayScore: { not: null },
        },
      },
      include: {
        fixture: {
          include: {
            homeTeam: true,
            awayTeam: true,
            competition: true,
          },
        },
      },
      orderBy: { fixture: { utcKickoff: 'desc' } },
      take: 250,
    }),
  ]);

  const fixtureIds = upcomingFixtures.map((fixture) => fixture.id);
  const crowdPredictions = fixtureIds.length
    ? await prisma.prediction.findMany({
      where: { fixtureId: { in: fixtureIds } },
      select: { fixtureId: true, homeScore: true, awayScore: true },
    })
    : [];

  const predictionsByFixture = new Map<string, Array<{ homeScore: number; awayScore: number }>>();
  for (const prediction of crowdPredictions) {
    const entries = predictionsByFixture.get(prediction.fixtureId) ?? [];
    entries.push({ homeScore: prediction.homeScore, awayScore: prediction.awayScore });
    predictionsByFixture.set(prediction.fixtureId, entries);
  }

  const upcomingByDay = new Map<string, { date: Date; label: string; fixtures: any[] }>();
  for (const fixture of upcomingFixtures) {
    const key = dayKey(fixture.utcKickoff);
    const group = upcomingByDay.get(key) ?? {
      date: dayStart(fixture.utcKickoff),
      label: formatDayLabel(fixture.utcKickoff, now),
      fixtures: [],
    };

    group.fixtures.push({
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
      odds: computeOdds(predictionsByFixture.get(fixture.id) ?? []),
    });
    upcomingByDay.set(key, group);
  }

  const pastByDay = new Map<string, { date: Date; label: string; fixtures: any[]; totalPoints: number }>();
  for (const prediction of pastPredictions) {
    const fixture = prediction.fixture;
    const key = dayKey(fixture.utcKickoff);
    const group = pastByDay.get(key) ?? {
      date: dayStart(fixture.utcKickoff),
      label: formatDayLabel(fixture.utcKickoff, now),
      fixtures: [],
      totalPoints: 0,
    };

    group.fixtures.push({
      id: fixture.id,
      kickoff: fixture.utcKickoff,
      competition: fixture.competition.name,
      home: fixture.homeTeam.name,
      away: fixture.awayTeam.name,
      result: { homeScore: fixture.homeScore ?? 0, awayScore: fixture.awayScore ?? 0 },
      prediction: { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
      points: prediction.pointsAwarded,
    });
    group.totalPoints += prediction.pointsAwarded;
    pastByDay.set(key, group);
  }

  const upcomingGroups = Array.from(upcomingByDay.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((group) => ({
      ...group,
      fixtures: group.fixtures.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
    }));

  const pastGroups = Array.from(pastByDay.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((group) => ({
      ...group,
      fixtures: group.fixtures.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()),
    }));

  return {
    upcomingDays,
    upcomingGroups,
    pastGroups,
  };
}
