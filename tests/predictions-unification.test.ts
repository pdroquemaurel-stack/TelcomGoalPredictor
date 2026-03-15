import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isPastFixture, isUpcomingFixture } from '@/lib/predictions-fixture-filters';
import { getFixtureLifecycleStatus } from '@/lib/fixture-lifecycle';

test('upcoming fixtures include scheduled and live, but not finished', () => {
  assert.equal(isUpcomingFixture({ fixtureState: 'SCHEDULED', kickoff: '2026-03-12T12:00:00.000Z', savedPrediction: null }), true);
  assert.equal(isUpcomingFixture({ fixtureState: 'LIVE', kickoff: '2026-03-12T12:00:00.000Z', savedPrediction: null }), true);
  assert.equal(isUpcomingFixture({ fixtureState: 'FINISHED', kickoff: '2026-03-12T12:00:00.000Z', savedPrediction: null }), false);
  assert.equal(isUpcomingFixture({ fixtureState: 'SETTLED', kickoff: '2026-03-12T12:00:00.000Z', savedPrediction: null }), false);
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

test('past fixtures keep historical behavior: kickoff in the past and prediction saved', () => {
  const now = +new Date('2026-03-12T15:00:00.000Z');

  assert.equal(isPastFixture({ fixtureState: 'FINISHED', kickoff: '2026-03-12T14:00:00.000Z', savedPrediction: { homeScore: 1, awayScore: 0 } }, now), true);
  assert.equal(isPastFixture({ fixtureState: 'FINISHED', kickoff: '2026-03-12T14:00:00.000Z', savedPrediction: null }, now), false);
  assert.equal(isPastFixture({ fixtureState: 'SCHEDULED', kickoff: '2026-03-12T18:00:00.000Z', savedPrediction: { homeScore: 1, awayScore: 0 } }, now), false);
});

test('daily page redirects to unified predictions page', async () => {
  const dailyPage = await fs.readFile('src/app/daily/page.tsx', 'utf8');
  assert.match(dailyPage, /redirect\('\/predictions'\)/);
});

test('bottom navigation points Pronos du jour to predictions page', async () => {
  const nav = await fs.readFile('src/components/player-nav.tsx', 'utf8');
  assert.match(nav, /\['\/predictions', 'Pronos du jour'\]/);
});

test('predictions screen no longer renders a competition selector', async () => {
  const client = await fs.readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  assert.doesNotMatch(client, /<select/);
  assert.match(client, /Matchs à venir/);
  assert.match(client, /Matchs passés/);
});

test('predictions screen includes quick toggle for "Afficher uniquement mes pronos" and applies it on upcoming', async () => {
  const client = await fs.readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  assert.match(client, /Afficher uniquement mes pronos/);
  assert.match(client, /showOnlyMine \? Boolean\(fixture.savedPrediction\) : true/);
  assert.match(client, /\{showOnlyMine \? 'On' : 'Off'\}/);
});

test('fixture card blocks editing when locked or resolved and keeps lock overlay for locked', async () => {
  const card = await fs.readFile('src/components/fixture-prediction-card.tsx', 'utf8');
  assert.match(card, /const canEditPrediction = editable && !isLocked && !finalScore/);
  assert.match(card, /\{canEditPrediction \? \(/);
  assert.match(card, /data-testid="locked-overlay"/);
  assert.match(card, /Pronostic verrouillé/);
});

test('public fixtures endpoint only uses admin-visible active competitions', async () => {
  const endpoint = await fs.readFile('src/app/api/public/fixtures/route.ts', 'utf8');
  assert.match(endpoint, /competition:\s*\{\s*visible:\s*true,\s*active:\s*true/);
});
