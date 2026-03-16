export type FixtureForFilters = {
  kickoff: string;
  fixtureState: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'SETTLED';
  lifecycleStatus?: 'upcoming' | 'live' | 'locked' | 'resolved';
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore?: { homeScore: number; awayScore: number } | null;
};

function hasStarted(fixture: FixtureForFilters, now: number) {
  return +new Date(fixture.kickoff) <= now;
}

function isLiveFixture(fixture: FixtureForFilters) {
  if (fixture.lifecycleStatus) return fixture.lifecycleStatus === 'live';
  return fixture.fixtureState === 'LIVE';
}

function isResolvedFixture(fixture: FixtureForFilters) {
  if (fixture.lifecycleStatus) return fixture.lifecycleStatus === 'resolved';
  if (fixture.finalScore) return true;
  return fixture.fixtureState === 'FINISHED' || fixture.fixtureState === 'SETTLED';
}

export function isUpcomingFixture(fixture: FixtureForFilters, now = Date.now()) {
  if (isLiveFixture(fixture)) return true;
  if (isResolvedFixture(fixture)) return false;
  return !hasStarted(fixture, now);
}

export function isPastFixture(fixture: FixtureForFilters, now = Date.now()) {
  if (!fixture.savedPrediction) return false;
  if (isResolvedFixture(fixture)) return true;
  return hasStarted(fixture, now) && !isLiveFixture(fixture);
}
