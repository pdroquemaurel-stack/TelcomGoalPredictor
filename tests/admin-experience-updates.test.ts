import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';

test('active challenge filter keeps active challenges including upcoming ones', () => {
  const now = new Date('2026-03-12T00:00:00.000Z');
  const filter = getActiveChallengesFilter(now);
  assert.equal(filter.isActive, true);
  assert.deepEqual(filter.endDate, { gte: now });
});

test('daily page redirects players to predictions', async () => {
  const fs = await import('node:fs/promises');
  const page = await fs.readFile('src/app/daily/page.tsx', 'utf8');
  assert.match(page, /redirect\('\/predictions'\)/);
});

test('competitions admin page no longer exposes daily toggle', async () => {
  const fs = await import('node:fs/promises');
  const page = await fs.readFile('src/app/admin/competitions/page.tsx', 'utf8');
  assert.doesNotMatch(page, /Flux quotidien/);
  assert.match(page, /finished\} \/ \{competition\._count\.fixtures\}/);
});

test('challenge migration adds challenge type and completion fields', async () => {
  const fs = await import('node:fs/promises');
  const migrationSql = await fs.readFile('prisma/migrations/20260318100000_admin_analytics_challenge_types/migration.sql', 'utf8');
  assert.match(migrationSql, /CREATE TYPE "ChallengeType"/);
  assert.match(migrationSql, /ADD COLUMN "completionMode"/);
});
