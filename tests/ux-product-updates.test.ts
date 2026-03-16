import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { calculatePredictionActivityStreak } from '@/lib/profile-streak';
import { isBadgeEarned } from '@/lib/badge-rules';

test('signin page has no prefilled credentials and includes password visibility toggle', async () => {
  const signin = await fs.readFile('src/app/auth/signin/page.tsx', 'utf8');
  assert.match(signin, /useState\(''\)/);
  assert.match(signin, /type=\{showPassword \? 'text' : 'password'\}/);
  assert.match(signin, /Afficher le mot de passe/);
});

test('signup page has password hidden by default and toggle button', async () => {
  const signup = await fs.readFile('src/app/auth/signup/page.tsx', 'utf8');
  assert.match(signup, /const \[password, setPassword\] = useState\(''\)/);
  assert.match(signup, /type=\{showPassword \? 'text' : 'password'\}/);
  assert.match(signup, /placeholder:text-zinc-500/);
});

test('challenge detail page uses shared upcoming/past fixtures client and no mine-only toggle', async () => {
  const challengePage = await fs.readFile('src/app/challenges/[slug]/page.tsx', 'utf8');
  const challengeClient = await fs.readFile('src/app/challenges/[slug]/challenge-fixtures-client.tsx', 'utf8');
  assert.match(challengePage, /ChallengeFixturesClient/);
  assert.match(challengeClient, /Matchs à venir/);
  assert.match(challengeClient, /Matchs passés/);
  assert.doesNotMatch(challengeClient, /Afficher uniquement mes pronos/);
});

test('profile page includes streak dots, badge carousel, and logout button', async () => {
  const profile = await fs.readFile('src/app/profile/page.tsx', 'utf8');
  const logoutButton = await fs.readFile('src/components/logout-button.tsx', 'utf8');
  assert.match(profile, /Streak 7 jours/);
  assert.match(profile, /grid-cols-7/);
  assert.match(profile, /overflow-x-auto/);
  assert.match(profile, /LogoutButton/);
  assert.match(logoutButton, /signOut\(\{ callbackUrl: '\/auth\/signup' \}\)/);
});

test('streak helper caps display source with consecutive day logic', () => {
  const streak = calculatePredictionActivityStreak([
    new Date('2026-03-16T09:00:00.000Z'),
    new Date('2026-03-15T09:00:00.000Z'),
    new Date('2026-03-14T09:00:00.000Z'),
  ], new Date('2026-03-16T12:00:00.000Z'));

  assert.equal(streak, 3);
});

test('badge rules support total, winning and exact prediction thresholds', () => {
  const progress = { totalPredictions: 12, winningPredictions: 6, exactPredictions: 2 };
  assert.equal(isBadgeEarned({ type: 'total_predictions', threshold: 10 }, progress), true);
  assert.equal(isBadgeEarned({ type: 'winning_predictions', threshold: 7 }, progress), false);
  assert.equal(isBadgeEarned({ type: 'exact_predictions', threshold: 2 }, progress), true);
});
