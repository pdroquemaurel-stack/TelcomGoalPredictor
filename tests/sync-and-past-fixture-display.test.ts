import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureState } from '@prisma/client';
import { buildAdminSyncWindow } from '@/lib/admin-sync-window';
import { mapFixtureState, mergeFixtureScores } from '@/lib/sync';
import {
  getPastFixtureStatusMessage,
  PAST_FIXTURE_SCORE_PENDING_TEXT,
  shouldShowFixtureOdds,
} from '@/lib/past-fixture-display';

test('admin sync window includes recently finished matches with a 10-day span (J-3 to J+7)', () => {
  const now = new Date('2026-07-20T10:00:00.000Z');
  const window = buildAdminSyncWindow(now);

  assert.equal(window.from, '2026-07-17');
  assert.equal(window.to, '2026-07-27');
});

test('mergeFixtureScores keeps existing persisted score when provider score is null', () => {
  const merged = mergeFixtureScores(
    { homeScore: 2, awayScore: 1 },
    { homeScore: null, awayScore: undefined },
  );

  assert.deepEqual(merged, { homeScore: 2, awayScore: 1 });
});

test('mapFixtureState marks fixture as FINISHED when final score is available', () => {
  const state = mapFixtureState('FINISHED', 3, 1);

  assert.equal(state.fixtureState, FixtureState.FINISHED);
  assert.equal(state.predictionEnabled, false);
});

test('past fixtures hide odds, upcoming fixtures keep odds', () => {
  assert.equal(shouldShowFixtureOdds(true), false);
  assert.equal(shouldShowFixtureOdds(false), true);
});

test('past finished fixture without final score shows waiting message', () => {
  const message = getPastFixtureStatusMessage(true, true);
  assert.equal(message, PAST_FIXTURE_SCORE_PENDING_TEXT);
});

test('no waiting message for upcoming fixture even without score', () => {
  const message = getPastFixtureStatusMessage(false, true);
  assert.equal(message, null);
});
