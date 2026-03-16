import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isPastFixture, isUpcomingFixture } from '@/lib/predictions-fixture-filters';
import { getFixtureLifecycleStatus } from '@/lib/fixture-lifecycle';

test('upcoming fixtures include future scheduled and live, but not stale old or finished fixtures', () => {
  const now = +new Date('2026-03-16T12:00:00.000Z');

  assert.equal(isUpcomingFixture({ fixtureState: 'SCHEDULED', kickoff: '2026-03-17T12:00:00.000Z', savedPrediction: null }, now), true);
  assert.equal(isUpcomingFixture({ fixtureState: 'LIVE', kickoff: '2026-03-16T10:00:00.000Z', savedPrediction: null }, now), true);
  assert.equal(isUpcomingFixture({ fixtureState: 'SCHEDULED', kickoff: '2026-03-13T12:00:00.000Z', savedPrediction: null }, now), false);
  assert.equal(isUpcomingFixture({ fixtureState: 'FINISHED', kickoff: '2026-03-16T11:00:00.000Z', savedPrediction: null }, now), false);
  assert.equal(isUpcomingFixture({ fixtureState: 'SETTLED', kickoff: '2026-03-16T11:00:00.000Z', savedPrediction: null }, now), false);
});

test('fixture lifecycle marks finished fixtures as resolved, scheduled future as upcoming, and live as live', () => {
  const now = +new Date('2026-03-15T10:00:00.000Z');

  assert.equal(getFixtureLifecycleStatus({
    fixtureState: 'FINISHED',
    utcKickoff: '2026-03-15T08:00:00.000Z',
    predictionEnabled: false,
    homeScore: 1,
    awayScore: 0,
  }, now), 'resolved');

  assert.equal(getFixtureLifecycleStatus({
    fixtureState: 'SCHEDULED',
    utcKickoff: '2026-03-15T15:00:00.000Z',
    predictionEnabled: true,
    homeScore: null,
    awayScore: null,
  }, now), 'upcoming');

  assert.equal(getFixtureLifecycleStatus({
    fixtureState: 'LIVE',
    utcKickoff: '2026-03-15T09:30:00.000Z',
    predictionEnabled: false,
    homeScore: null,
    awayScore: null,
  }, now), 'live');
});

test('live fixture remains visible in upcoming tab but is rendered locked for editing', async () => {
  const endpoint = await fs.readFile('src/app/api/public/fixtures/route.ts', 'utf8');
  assert.match(endpoint, /lifecycleStatus === 'live' \|\| lifecycleStatus === 'locked'/);
});

test('past fixtures include predicted past fixtures even without final score, and exclude non-predicted fixtures', () => {
  const now = +new Date('2026-03-16T21:00:00.000Z');

  assert.equal(isPastFixture({ fixtureState: 'FINISHED', lifecycleStatus: 'resolved', kickoff: '2026-03-16T20:30:00.000Z', savedPrediction: { homeScore: 1, awayScore: 0 } }, now), true);
  assert.equal(isPastFixture({ fixtureState: 'SCHEDULED', kickoff: '2026-03-16T17:00:00.000Z', savedPrediction: { homeScore: 2, awayScore: 1 }, finalScore: null }, now), true);
  assert.equal(isPastFixture({ fixtureState: 'FINISHED', kickoff: '2026-03-16T20:30:00.000Z', savedPrediction: null }, now), false);
  assert.equal(isPastFixture({ fixtureState: 'LIVE', kickoff: '2026-03-16T20:00:00.000Z', savedPrediction: { homeScore: 0, awayScore: 0 } }, now), false);
});



test('upcoming and past fixture filters stay mutually consistent for predictions and challenge fixtures', () => {
  const now = +new Date('2026-03-16T12:00:00.000Z');
  const fixtures = [
    { id: 'future', fixtureState: 'SCHEDULED' as const, kickoff: '2026-03-17T12:00:00.000Z', savedPrediction: null, finalScore: null },
    { id: 'live', fixtureState: 'LIVE' as const, kickoff: '2026-03-16T11:45:00.000Z', savedPrediction: { homeScore: 1, awayScore: 1 }, finalScore: null },
    { id: 'stale', fixtureState: 'SCHEDULED' as const, kickoff: '2026-03-13T12:00:00.000Z', savedPrediction: { homeScore: 2, awayScore: 0 }, finalScore: null },
    { id: 'resolved', fixtureState: 'FINISHED' as const, kickoff: '2026-03-16T09:00:00.000Z', savedPrediction: { homeScore: 1, awayScore: 0 }, finalScore: { homeScore: 1, awayScore: 0 } },
  ];

  const upcomingIds = fixtures.filter((fixture) => isUpcomingFixture(fixture, now)).map((fixture) => fixture.id);
  const pastIds = fixtures.filter((fixture) => isPastFixture(fixture, now)).map((fixture) => fixture.id);

  assert.deepEqual(upcomingIds, ['future', 'live']);
  assert.deepEqual(pastIds, ['stale', 'resolved']);
});

test('daily page redirects to unified predictions page', async () => {
  const dailyPage = await fs.readFile('src/app/daily/page.tsx', 'utf8');
  assert.match(dailyPage, /redirect\('\/predictions'\)/);
});

test('bottom navigation points Pronos du jour to predictions page', async () => {
  const nav = await fs.readFile('src/components/player-nav.tsx', 'utf8');
  assert.match(nav, /\['\/predictions', 'Pronos du jour'\]/);
});

test('predictions and challenge pages use shared fixture filters with expected sorting direction', async () => {
  const predictionsClient = await fs.readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  const challengeClient = await fs.readFile('src/app/challenges/[slug]/challenge-fixtures-client.tsx', 'utf8');

  assert.match(predictionsClient, /filter\(\(fixture\) => isUpcomingFixture\(fixture\)\)/);
  assert.match(predictionsClient, /filter\(\(fixture\) => isPastFixture\(fixture\)\)/);
  assert.match(challengeClient, /filter\(\(fixture\) => isUpcomingFixture\(fixture\)\)/);
  assert.match(challengeClient, /filter\(\(fixture\) => isPastFixture\(fixture\)\)/);

  assert.match(predictionsClient, /sort\(\(a, b\) => \+new Date\(a\.kickoff\) - \+new Date\(b\.kickoff\)\)/);
  assert.match(predictionsClient, /sort\(\(a, b\) => \+new Date\(b\.kickoff\) - \+new Date\(a\.kickoff\)\)/);
  assert.match(challengeClient, /sort\(\(a, b\) => \+new Date\(a\.kickoff\) - \+new Date\(b\.kickoff\)\)/);
  assert.match(challengeClient, /sort\(\(a, b\) => \+new Date\(b\.kickoff\) - \+new Date\(a\.kickoff\)\)/);
});

test('predictions screen no longer renders a competition selector', async () => {
  const client = await fs.readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  assert.doesNotMatch(client, /<select/);
  assert.match(client, /Matchs à venir/);
  assert.match(client, /Matchs passés/);
});

test('predictions screen shows X / Y counter and no mine-only toggle', async () => {
  const client = await fs.readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  assert.match(client, /pronostic\(s\) enregistré\(s\) \/ \{availablePredictionsCount\}/);
  assert.doesNotMatch(client, /Afficher uniquement mes pronos/);
});


test('fixture card blocks editing when locked or resolved and keeps lock overlay for locked', async () => {
  const card = await fs.readFile('src/components/fixture-prediction-card.tsx', 'utf8');
  assert.match(card, /const canEditPrediction = editable && !isLocked && !finalScore/);
  assert.match(card, /data-testid="past-score-display"/);
  assert.match(card, /data-testid="past-points"/);
  assert.match(card, /getFixtureLockVisualState\(isLocked && !finalScore\)/);
});

test('public fixtures endpoint only uses admin-visible active competitions', async () => {
  const endpoint = await fs.readFile('src/app/api/public/fixtures/route.ts', 'utf8');
  assert.match(endpoint, /competition:\s*\{\s*visible:\s*true,\s*active:\s*true/);
});
