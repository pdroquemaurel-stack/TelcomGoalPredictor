export const PAST_FIXTURE_SCORE_PENDING_TEXT = 'En attente du score du match';

export function shouldShowFixtureOdds(isPastFixture: boolean) {
  return !isPastFixture;
}

export function getPastFixtureStatusMessage(isPastFixture: boolean, isFinishedWithoutScore: boolean) {
  if (!isPastFixture || !isFinishedWithoutScore) return null;
  return PAST_FIXTURE_SCORE_PENDING_TEXT;
}
