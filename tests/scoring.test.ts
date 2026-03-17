import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePredictionPoints, isFixtureFinished } from '@/lib/scoring';

test('calculatePredictionPoints returns 3 for exact score', () => {
  assert.equal(calculatePredictionPoints(2, 1, 2, 1), 3);
});

test('calculatePredictionPoints returns 1 for correct outcome', () => {
  assert.equal(calculatePredictionPoints(1, 0, 3, 1), 1);
  assert.equal(calculatePredictionPoints(0, 0, 2, 2), 1);
});

test('calculatePredictionPoints returns 0 for wrong outcome', () => {
  assert.equal(calculatePredictionPoints(2, 1, 1, 3), 0);
});

test('isFixtureFinished accepts SETTLED for deterministic rescoring path', () => {
  assert.equal(isFixtureFinished('SETTLED', 2, 1), true);
});
