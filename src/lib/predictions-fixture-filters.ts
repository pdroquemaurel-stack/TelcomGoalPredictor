export type FixtureForFilters = {
  kickoff: string;
  fixtureState: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'SETTLED';
  savedPrediction: { homeScore: number; awayScore: number } | null;
};

export function isUpcomingFixture(fixture: FixtureForFilters) {
  return fixture.fixtureState === 'SCHEDULED' || fixture.fixtureState === 'LIVE';
}

export function isPastFixture(fixture: FixtureForFilters, now = Date.now()) {
  return +new Date(fixture.kickoff) < now && Boolean(fixture.savedPrediction);
}
