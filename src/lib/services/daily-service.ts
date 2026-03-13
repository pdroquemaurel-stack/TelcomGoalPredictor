import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getTeamLogoUrl } from '@/lib/team-logo';

const DAILY_DAYS_SETTING_KEY = 'dailyDisplayDays';
const DEFAULT_DAILY_DAYS = 2;

type OutcomeOdds = {
  homeWin: string;
  draw: string;
  awayWin: string;
};

type DailyFixtureUi = {
  id: string;
  kickoff: Date;
  competition: string;
  competitionId: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  state: 'saved' | 'open';
  savedPrediction: { homeScore: number; awayScore: number } | null;
  odds: OutcomeOdds;
};

type PastFixtureUi = {
  id: string;
  kickoff: Date;
  competition: string;
  competitionId: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  finalScore: { homeScore: number; awayScore: number } | null;
  savedPrediction: { homeScore: number; awayScore: number };
  points: number;
};

function dayRange(offsetDays = 0) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function startOfToday(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatOdds(count: number, total: number) {
  if (total === 0) return '2.0';
  if (count === 0) return '9.9';
  return (1 / (count / total)).toFixed(1);
}

function computeOdds(predictions: Array<{ homeScore: number; awayScore: number }>): OutcomeOdds {
  const counts = predictions.reduce(
    (acc, prediction) => {
      if (prediction.homeScore > prediction.awayScore) acc.homeWin += 1;
      else if (prediction.homeScore < prediction.awayScore) acc.awayWin += 1;
      else acc.draw += 1;
      return acc;
    },
    { homeWin: 0, draw: 0, awayWin: 0 },
  );

  const total = counts.homeWin + counts.draw + counts.awayWin;

  return {
    homeWin: formatOdds(counts.homeWin, total),
    draw: formatOdds(counts.draw, total),
    awayWin: formatOdds(counts.awayWin, total),
  };
}

export function isFixtureInDailyWindow(kickoff: Date, now = new Date()) {
  const start = startOfToday(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return kickoff >= start && kickoff < end;
}

export async function getDailyDisplayDays() {
  const setting = await prisma.appSetting.findUnique({ where: { key: DAILY_DAYS_SETTING_KEY } });
  const parsed = Number(setting?.value);
  if (!Number.isInteger(parsed)) return DEFAULT_DAILY_DAYS;
  return Math.min(7, Math.max(1, parsed));
}

export async function setDailyDisplayDays(days: number) {
  const safeDays = Math.min(7, Math.max(1, Math.floor(days)));
  await prisma.appSetting.upsert({
    where: { key: DAILY_DAYS_SETTING_KEY },
    create: { key: DAILY_DAYS_SETTING_KEY, value: String(safeDays) },
    update: { value: String(safeDays) },
  });
  return safeDays;
}

function formatDayLabel(date: Date, now = new Date()) {
  const today = startOfToday(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  if (day.getTime() === today.getTime()) return "Aujourd'hui";
  if (day.getTime() === tomorrow.getTime()) return 'Demain';

  return day.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function getDailyFixturesForUser(userId: string) {
  const displayDays = await getDailyDisplayDays();
  const today = dayRange(0);
  const futureEnd = dayRange(displayDays - 1).end;
  const now = new Date();

  const [upcomingFixtures, pastPredictions] = await Promise.all([
    prisma.fixture.findMany({
      where: {
        visible: true,
        predictionEnabled: true,
        fixtureState: FixtureState.SCHEDULED,
        competition: { visible: true, active: true, isDailyEnabled: true },
        utcKickoff: { gte: today.start, lt: futureEnd },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        predictions: {
          select: {
            homeScore: true,
            awayScore: true,
            userId: true,
          },
        },
      },
      orderBy: [{ utcKickoff: 'asc' }],
      take: 300,
    }),
    prisma.prediction.findMany({
      where: {
        userId,
        fixture: {
          visible: true,
          fixtureState: { in: [FixtureState.FINISHED, FixtureState.SETTLED] },
          competition: { visible: true, active: true, isDailyEnabled: true },
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
      orderBy: [{ fixture: { utcKickoff: 'desc' } }],
      take: 300,
    }),
  ]);

  const upcomingByDay = new Map<string, { label: string; date: Date; fixtures: DailyFixtureUi[] }>();

  for (const fixture of upcomingFixtures) {
    const key = dateKey(fixture.utcKickoff);
    if (!upcomingByDay.has(key)) {
      const day = new Date(fixture.utcKickoff);
      day.setHours(0, 0, 0, 0);
      upcomingByDay.set(key, {
        label: formatDayLabel(day, now),
        date: day,
        fixtures: [],
      });
    }

    const userPrediction = fixture.predictions.find((prediction) => prediction.userId === userId) ?? null;
    const odds = computeOdds(fixture.predictions.map((prediction) => ({
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
    })));

    upcomingByDay.get(key)!.fixtures.push({
      id: fixture.id,
      kickoff: fixture.utcKickoff,
      competition: fixture.competition.name,
      competitionId: fixture.competitionId,
      home: fixture.homeTeam.name,
      homeLogoUrl: getTeamLogoUrl(fixture.homeTeam),
      away: fixture.awayTeam.name,
      awayLogoUrl: getTeamLogoUrl(fixture.awayTeam),
      state: userPrediction ? 'saved' : 'open',
      savedPrediction: userPrediction
        ? {
            homeScore: userPrediction.homeScore,
            awayScore: userPrediction.awayScore,
          }
        : null,
      odds,
    });
  }

  const pastByDay = new Map<string, { label: string; date: Date; fixtures: PastFixtureUi[]; totalPoints: number }>();

  for (const prediction of pastPredictions) {
    const fixture = prediction.fixture;
    const key = dateKey(fixture.utcKickoff);

    if (!pastByDay.has(key)) {
      const day = new Date(fixture.utcKickoff);
      day.setHours(0, 0, 0, 0);
      pastByDay.set(key, {
        label: formatDayLabel(day, now),
        date: day,
        fixtures: [],
        totalPoints: 0,
      });
    }

    const group = pastByDay.get(key)!;
    group.fixtures.push({
      id: fixture.id,
      kickoff: fixture.utcKickoff,
      competition: fixture.competition.name,
      competitionId: fixture.competitionId,
      home: fixture.homeTeam.name,
      homeLogoUrl: getTeamLogoUrl(fixture.homeTeam),
      away: fixture.awayTeam.name,
      awayLogoUrl: getTeamLogoUrl(fixture.awayTeam),
      finalScore:
        typeof fixture.homeScore === 'number' && typeof fixture.awayScore === 'number'
          ? { homeScore: fixture.homeScore, awayScore: fixture.awayScore }
          : null,
      savedPrediction: { homeScore: prediction.homeScore, awayScore: prediction.awayScore },
      points: prediction.pointsAwarded,
    });
    group.totalPoints += prediction.pointsAwarded;
  }

  return {
    displayDays,
    upcomingGroups: Array.from(upcomingByDay.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((group) => ({
        label: group.label,
        date: group.date,
        fixtures: group.fixtures.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime()),
      })),
    pastGroups: Array.from(pastByDay.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((group) => ({
        label: group.label,
        date: group.date,
        fixtures: group.fixtures.sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime()),
        totalPoints: group.totalPoints,
      })),
  };
}
