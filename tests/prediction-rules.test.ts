import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureState } from '@prisma/client';
import { canSubmitPrediction } from '@/lib/services/prediction-rules';

test('canSubmitPrediction allows scheduled fixtures before kickoff', () => {
  const kickoff = new Date(Date.now() + 3600_000);
  assert.equal(canSubmitPrediction(FixtureState.SCHEDULED, true, kickoff, new Date()), true);
});

test('canSubmitPrediction blocks prediction after kickoff', () => {
  const kickoff = new Date(Date.now() - 1_000);
  assert.equal(canSubmitPrediction(FixtureState.SCHEDULED, true, kickoff, new Date()), false);
});

test('canSubmitPrediction blocks non-scheduled fixture states', () => {
  const kickoff = new Date(Date.now() + 3600_000);
  assert.equal(canSubmitPrediction(FixtureState.LIVE, true, kickoff, new Date()), false);
  assert.equal(canSubmitPrediction(FixtureState.SETTLED, false, kickoff, new Date()), false);
});
