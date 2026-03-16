import { FootballProvider, DateRange } from './types';

const BASE = 'https://api.football-data.org/v4';

function getErrorMessageFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  if ('message' in body && typeof body.message === 'string') return body.message;
  if ('error' in body && typeof body.error === 'string') return body.error;
  if ('detail' in body && typeof body.detail === 'string') return body.detail;
  return null;
}

async function readErrorDetails(res: Response) {
  try {
    const body = await res.clone().json();
    const message = getErrorMessageFromBody(body);
    if (message) return message;
  } catch {
    // noop: body might not be valid JSON
  }

  try {
    const text = (await res.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

async function fetchJSON(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || '' },
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    const details = await readErrorDetails(res);
    throw new Error(`football-data error ${res.status}${details ? `: ${details}` : ''}`);
  }
  return res.json();
}

export class FootballDataProvider implements FootballProvider {
  async getCompetitions() {
    const data = await fetchJSON('/competitions');
    return (data.competitions || []).map((c: any) => ({
      externalId: String(c.id),
      code: c.code,
      name: c.name,
      country: c.area?.name,
    }));
  }

  async getTeams(competitionCode: string) {
    const data = await fetchJSON(`/competitions/${competitionCode}/teams`);
    return (data.teams || []).map((t: any) => ({
      externalId: String(t.id),
      name: t.name,
      shortName: t.shortName,
      crestUrl: t.crest,
    }));
  }

  async getFixtures(dateRange: DateRange, competitionCode?: string) {
    const basePath = competitionCode
      ? `/competitions/${competitionCode}/matches?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`
      : `/matches?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`;
    const data = await fetchJSON(basePath);
    return (data.matches || []).map((m: any) => ({
      externalId: String(m.id),
      competitionExternalId: String(m.competition?.id),
      homeTeamExternalId: String(m.homeTeam?.id),
      homeTeamName: m.homeTeam?.name ?? `Team ${String(m.homeTeam?.id ?? '')}`.trim(),
      homeTeamShortName: m.homeTeam?.shortName ?? undefined,
      homeTeamCrest: m.homeTeam?.crest ?? undefined,
      awayTeamExternalId: String(m.awayTeam?.id),
      awayTeamName: m.awayTeam?.name ?? `Team ${String(m.awayTeam?.id ?? '')}`.trim(),
      awayTeamShortName: m.awayTeam?.shortName ?? undefined,
      awayTeamCrest: m.awayTeam?.crest ?? undefined,
      utcKickoff: m.utcDate,
      statusText: m.status,
      homeScore: m.score?.fullTime?.home ?? m.score?.regularTime?.home,
      awayScore: m.score?.fullTime?.away ?? m.score?.regularTime?.away,
    }));
  }

  async getFixtureById(externalId: string) {
    const data = await fetchJSON(`/matches/${externalId}`);
    if (!data.match) return null;
    return {
      externalId,
      statusText: data.match.status,
      homeScore: data.match.score?.fullTime?.home ?? data.match.score?.regularTime?.home,
      awayScore: data.match.score?.fullTime?.away ?? data.match.score?.regularTime?.away,
    };
  }
}
