import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BadgeCriterionType } from '@prisma/client';
import { createBadgeInputSchema, normalizeBadgeSlug, isBadgeEarned } from '@/lib/badges';
import { resolveBadgeImagePath } from '@/lib/badge-image';

test('badge model supports valid slug + criterion and rejects empty slug', () => {
  const valid = createBadgeInputSchema.safeParse({
    name: '10 Pronos',
    slug: '10-pronos',
    criterionType: BadgeCriterionType.PREDICTION_COUNT,
    threshold: 10,
  });
  assert.equal(valid.success, true);

  const emptySlug = createBadgeInputSchema.safeParse({
    name: '10 Pronos',
    slug: '',
    criterionType: BadgeCriterionType.PREDICTION_COUNT,
    threshold: 10,
  });
  assert.equal(emptySlug.success, false);
});

test('badge schema and migration enforce unique slug', async () => {
  const schema = await fs.readFile('prisma/schema.prisma', 'utf8');
  const migration = await fs.readFile('prisma/migrations/20260317110000_dynamic_badges_slug/migration.sql', 'utf8');
  assert.match(schema, /slug\s+String\s+@unique/);
  assert.match(migration, /CREATE UNIQUE INDEX "Badge_slug_key"/);
});

test('badge image resolution uses slug image when available and fallback otherwise', async () => {
  const badgeDir = path.join(process.cwd(), 'public', 'badges');
  const slug = 'badge-test-temp';
  const imagePath = path.join(badgeDir, `${slug}.webp`);

  await fs.mkdir(badgeDir, { recursive: true });
  await fs.writeFile(imagePath, 'fake');

  assert.equal(resolveBadgeImagePath(slug), `/badges/${slug}.webp`);
  assert.equal(resolveBadgeImagePath('missing-badge-image'), '/badges/badge.webp');

  await fs.unlink(imagePath);
});

test('badge attribution thresholds cover prediction, correct and exact counters', () => {
  const progress = { predictionCount: 15, correctPredictionCount: 8, exactPredictionCount: 3 };

  assert.equal(isBadgeEarned(BadgeCriterionType.PREDICTION_COUNT, 10, progress), true);
  assert.equal(isBadgeEarned(BadgeCriterionType.CORRECT_PREDICTION_COUNT, 8, progress), true);
  assert.equal(isBadgeEarned(BadgeCriterionType.EXACT_PREDICTION_COUNT, 4, progress), false);
});

test('badge attribution remains idempotent via UserBadge unique constraint and skipDuplicates', async () => {
  const schema = await fs.readFile('prisma/schema.prisma', 'utf8');
  const service = await fs.readFile('src/lib/services/badge-service.ts', 'utf8');
  assert.match(schema, /@@unique\(\[userId, badgeId\]\)/);
  assert.match(service, /skipDuplicates:\s*true/);
});

test('admin badges page exposes creation form and badge listing fields', async () => {
  const adminBadgesPage = await fs.readFile('src/app/admin/badges/page.tsx', 'utf8');
  const adminBadgeForm = await fs.readFile('src/components/admin-badge-form.tsx', 'utf8');

  assert.match(adminBadgeForm, /name="name"/);
  assert.match(adminBadgeForm, /name="slug"/);
  assert.match(adminBadgeForm, /name="criterionType"/);
  assert.match(adminBadgeForm, /name="threshold"/);
  assert.match(adminBadgesPage, /badges\.map/);
});

test('profile page resolves badge image from slug with fallback helper', async () => {
  const profile = await fs.readFile('src/app/profile/page.tsx', 'utf8');
  assert.match(profile, /resolveBadgeImagePath\(badge\.slug\)/);
});

test('slug is normalized for admin editing', () => {
  assert.equal(normalizeBadgeSlug('10 Bons Pronos'), '10-bons-pronos');
});
