import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreFixturePredictions } from '@/lib/services/settlement-service';

test('scoreFixturePredictions computes points for each prediction', () => {
  const predictions = [
    { id: 'p1', userId: 'u1', homeScore: 2, awayScore: 1, pointsAwarded: 0 },
    { id: 'p2', userId: 'u2', homeScore: 1, awayScore: 0, pointsAwarded: 0 },
    { id: 'p3', userId: 'u3', homeScore: 0, awayScore: 2, pointsAwarded: 0 },
  ];

  const scored = scoreFixturePredictions(2, 1, predictions);

  assert.deepEqual(scored, [
    { id: 'p1', userId: 'u1', computedPoints: 3 },
    { id: 'p2', userId: 'u2', computedPoints: 1 },
    { id: 'p3', userId: 'u3', computedPoints: 0 },
  ]);
});
