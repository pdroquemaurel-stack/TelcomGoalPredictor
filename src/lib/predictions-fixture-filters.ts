export type FixtureForFilters = {
  kickoff: string;
  fixtureState: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'SETTLED';
  lifecycleStatus?: 'upcoming' | 'live' | 'locked' | 'resolved';
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore?: { homeScore: number; awayScore: number } | null;
};

function isResolvedFixture(fixture: FixtureForFilters) {
  if (fixture.lifecycleStatus) return fixture.lifecycleStatus === 'resolved';
  if (fixture.finalScore) return true;
  return fixture.fixtureState === 'FINISHED' || fixture.fixtureState === 'SETTLED';
}

export function isUpcomingFixture(fixture: FixtureForFilters, _now = Date.now()) {
  return !isResolvedFixture(fixture);
}

export function isPastFixture(fixture: FixtureForFilters, _now = Date.now()) {
  if (!fixture.savedPrediction) return false;
  return isResolvedFixture(fixture);
}
