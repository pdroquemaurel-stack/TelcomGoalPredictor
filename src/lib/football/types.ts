export type DateRange = { from: string; to: string };

export interface FootballProvider {
  getCompetitions(): Promise<Array<{ externalId: string; code?: string; name: string; country?: string }>>;
  getTeams(competitionCode: string): Promise<Array<{ externalId: string; name: string; shortName?: string; crestUrl?: string }>>;
  getFixtures(dateRange: DateRange, competitionCode?: string): Promise<Array<{
    externalId: string;
    competitionExternalId: string;
    homeTeamExternalId: string;
    awayTeamExternalId: string;
    utcKickoff: string;
    statusText: string;
    homeScore?: number;
    awayScore?: number;
  }>>;
  getFixtureById(externalId: string): Promise<{
    externalId: string;
    statusText: string;
    homeScore?: number;
    awayScore?: number;
  } | null>;
}
