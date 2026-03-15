import test from 'node:test';
import assert from 'node:assert/strict';
import { getPredictionScoreColorClasses } from '@/lib/prediction-score-colors';
import { getFixtureLockVisualState } from '@/lib/fixture-lock-visuals';

test('score colors: home win => green/red', () => {
  assert.deepEqual(getPredictionScoreColorClasses({ homeScore: 2, awayScore: 1 }), {
    home: 'text-green-500',
    away: 'text-red-500',
  });
});

test('score colors: away win => red/green', () => {
  assert.deepEqual(getPredictionScoreColorClasses({ homeScore: 0, awayScore: 1 }), {
    home: 'text-red-500',
    away: 'text-green-500',
  });
});

test('score colors: draw => orange/orange', () => {
  assert.deepEqual(getPredictionScoreColorClasses({ homeScore: 1, awayScore: 1 }), {
    home: 'text-[#FF7900]',
    away: 'text-[#FF7900]',
  });
});

test('score colors: no score => neutral', () => {
  assert.deepEqual(getPredictionScoreColorClasses(null), {
    home: 'text-zinc-200',
    away: 'text-zinc-200',
  });
});

test('locked visual state exposes overlay and lock with lock above overlay', () => {
  const state = getFixtureLockVisualState(true);
  assert.equal(state.showLock, true);
  assert.match(state.overlayClassName, /z-10/);
  assert.match(state.lockClassName, /z-20/);
});

test('open visual state hides lock', () => {
  const state = getFixtureLockVisualState(false);
  assert.equal(state.showLock, false);
});
