import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatchOdds, filterOutCurrentUserPredictions, getPredictedOutcome } from '@/lib/prediction-odds';

test('calculateMatchOdds returns fallback odds when no other players predicted', () => {
  const odds = calculateMatchOdds([]);
  assert.deepEqual(odds, { homeWin: 3, draw: 3, awayWin: 3 });
});

test('calculateMatchOdds returns equal odds for balanced distribution', () => {
  const odds = calculateMatchOdds([
    { homeScore: 1, awayScore: 0 },
    { homeScore: 1, awayScore: 1 },
    { homeScore: 0, awayScore: 1 },
  ]);

  assert.equal(odds.homeWin, 3);
  assert.equal(odds.draw, 3);
  assert.equal(odds.awayWin, 3);
});

test('calculateMatchOdds lowers odds on majority outcome and raises alternatives', () => {
  const odds = calculateMatchOdds([
    { homeScore: 2, awayScore: 1 },
    { homeScore: 3, awayScore: 0 },
    { homeScore: 1, awayScore: 0 },
    { homeScore: 1, awayScore: 1 },
  ]);

  assert.ok(odds.homeWin < odds.draw);
  assert.ok(odds.homeWin < odds.awayWin);
  assert.ok(odds.awayWin > odds.homeWin);
});

test('calculateMatchOdds lowers draw odds when draw predictions dominate', () => {
  const odds = calculateMatchOdds([
    { homeScore: 1, awayScore: 1 },
    { homeScore: 0, awayScore: 0 },
    { homeScore: 2, awayScore: 2 },
    { homeScore: 2, awayScore: 1 },
  ]);

  assert.ok(odds.draw < odds.homeWin);
  assert.ok(odds.draw < odds.awayWin);
});

test('filterOutCurrentUserPredictions excludes connected user prediction from odds market', () => {
  const predictions = [
    { userId: 'u1', homeScore: 2, awayScore: 0 },
    { userId: 'u2', homeScore: 1, awayScore: 1 },
    { userId: 'u3', homeScore: 0, awayScore: 2 },
  ];

  const marketPredictions = filterOutCurrentUserPredictions(predictions, 'u2');
  assert.equal(marketPredictions.length, 2);
  assert.deepEqual(marketPredictions.map(getPredictedOutcome), ['HOME_WIN', 'AWAY_WIN']);
});
