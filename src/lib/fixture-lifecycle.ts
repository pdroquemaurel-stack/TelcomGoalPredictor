import { FixtureState } from '@prisma/client';

export type FixtureLifecycle = 'upcoming' | 'live' | 'locked' | 'resolved';

type FixtureLifecycleInput = {
  fixtureState: FixtureState;
  utcKickoff: Date | string;
  predictionEnabled: boolean;
  homeScore: number | null;
  awayScore: number | null;
};

function toEpochMs(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * Canonical fixture lifecycle used by API + predictions UI.
 *
 * Rules (MVP):
 * - resolved: finished/settled fixture states, or explicit final scores.
 * - live: live state from data provider.
 * - locked: match no longer editable (kickoff passed or prediction disabled) but not resolved.
 * - upcoming: scheduled and still editable.
 */
export function getFixtureLifecycleStatus(input: FixtureLifecycleInput, now = Date.now()): FixtureLifecycle {
  const kickoffMs = toEpochMs(input.utcKickoff);
  const hasFinalScore = input.homeScore !== null && input.awayScore !== null;

  if (
    input.fixtureState === FixtureState.SETTLED
    || input.fixtureState === FixtureState.FINISHED
    || hasFinalScore
  ) {
    return 'resolved';
  }

  if (input.fixtureState === FixtureState.LIVE) {
    return 'live';
  }

  const isPredictionWindowOpen = input.fixtureState === FixtureState.SCHEDULED
    && input.predictionEnabled
    && kickoffMs > now;

  return isPredictionWindowOpen ? 'upcoming' : 'locked';
}

