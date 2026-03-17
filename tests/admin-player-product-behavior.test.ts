import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isUpcomingFixture, isPastFixture } from '@/lib/predictions-fixture-filters';

test('dashboard analytics graph exposes toggles, country filter and tooltip support', async () => {
  const dashboard = await fs.readFile('src/app/admin/dashboard/page.tsx', 'utf8');
  const chart = await fs.readFile('src/components/admin-analytics-chart.tsx', 'utf8');

  assert.match(dashboard, /country/);
  assert.match(chart, /admin-analytics-chart/);
  assert.match(chart, /admin-analytics-point/);
  assert.match(chart, /admin-analytics-tooltip/);
  assert.match(chart, /setEnabled/);
});

test('settings page removes daily-enabled auto button and keeps key visibility toggles', async () => {
  const settings = await fs.readFile('src/app/admin/settings/page.tsx', 'utf8');
  assert.doesNotMatch(settings, /dailyAutoUseEnabledCompetitions/);
  assert.match(settings, /showChallengesBlock/);
  assert.match(settings, /showLeaderboardBlock/);
  assert.match(settings, /showShopBlock/);
  assert.match(settings, /Future days \(fenêtre \/predictions\)/);
});

test('predictions API uses future-day config window and tracks API request metric', async () => {
  const fixturesApi = await fs.readFile('src/app/api/public/fixtures/route.ts', 'utf8');
  assert.match(fixturesApi, /dailyFutureDays/);
  assert.match(fixturesApi, /trackApiRequest\('\/api\/public\/fixtures'/);
});

test('admin fixtures save action redirects back to list to close edit mode', async () => {
  const fixturesAdmin = await fs.readFile('src/app/admin/fixtures/page.tsx', 'utf8');
  assert.match(fixturesAdmin, /redirect\(returnTo/);
  assert.match(fixturesAdmin, /name="returnTo"/);
});

test('admin challenge list highlights active challenges with green tone', async () => {
  const adminChallenges = await fs.readFile('src/app/admin/challenges/page.tsx', 'utf8');
  assert.match(adminChallenges, /bg-emerald-100\/50/);
  assert.match(adminChallenges, /challenge\.isActive && challenge\.startDate <= now && challenge\.endDate >= now/);
});

test('profile streak always lights first day dot while connected', async () => {
  const profile = await fs.readFile('src/app/profile/page.tsx', 'utf8');
  assert.match(profile, /Math\.max\(1, Math\.min\(streak, 7\)\)/);
});

test('predictions show non-finished fixtures in upcoming and keep finished fixtures in past', () => {
  const liveFixture = {
    kickoff: '2026-03-18T12:00:00.000Z',
    fixtureState: 'LIVE' as const,
    lifecycleStatus: 'live' as const,
    savedPrediction: null,
    finalScore: null,
  };
  const lockedScheduled = {
    kickoff: '2026-03-17T12:00:00.000Z',
    fixtureState: 'SCHEDULED' as const,
    lifecycleStatus: 'locked' as const,
    savedPrediction: null,
    finalScore: null,
  };
  const finishedFixture = {
    kickoff: '2026-03-16T12:00:00.000Z',
    fixtureState: 'FINISHED' as const,
    lifecycleStatus: 'resolved' as const,
    savedPrediction: { homeScore: 1, awayScore: 0 },
    finalScore: { homeScore: 2, awayScore: 0 },
  };

  assert.equal(isUpcomingFixture(liveFixture), true);
  assert.equal(isUpcomingFixture(lockedScheduled), true);
  assert.equal(isUpcomingFixture(finishedFixture), false);
  assert.equal(isPastFixture(finishedFixture), true);
});

test('challenges player buttons and participant badge are explicit', async () => {
  const challenges = await fs.readFile('src/app/challenges/page.tsx', 'utf8');
  assert.match(challenges, /Commence dans \{daysToStart\} jours/);
  assert.match(challenges, /disabled/);
  assert.match(challenges, /S’inscrire au challenge/);
  assert.match(challenges, /participantCount/);
});

test('challenge detail hides leaderboard for completion challenges and admin type fields are conditional', async () => {
  const challengeDetail = await fs.readFile('src/app/challenges/[slug]/page.tsx', 'utf8');
  const adminCreate = await fs.readFile('src/app/admin/challenges/page.tsx', 'utf8');
  const adminEdit = await fs.readFile('src/app/admin/challenges/[id]/page.tsx', 'utf8');
  const typeFields = await fs.readFile('src/components/challenge-type-fields.tsx', 'utf8');

  assert.match(challengeDetail, /challenge\.challengeType === 'RANKING'/);
  assert.match(adminCreate, /ChallengeTypeFields/);
  assert.match(adminEdit, /ChallengeTypeFields/);
  assert.match(typeFields, /type === 'COMPLETION'/);
});
