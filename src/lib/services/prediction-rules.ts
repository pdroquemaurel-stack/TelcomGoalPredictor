import { FixtureState } from '@prisma/client';

export function canSubmitPrediction(
  fixtureState: FixtureState,
  predictionEnabled: boolean,
  kickoff: Date,
  now: Date = new Date(),
): boolean {
  return predictionEnabled && fixtureState === FixtureState.SCHEDULED && now < kickoff;
}
