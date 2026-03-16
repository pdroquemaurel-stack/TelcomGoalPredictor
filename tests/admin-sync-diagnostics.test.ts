import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAdminSyncError, validateAdminSyncConfig } from '@/lib/admin-sync-diagnostics';

test('validateAdminSyncConfig returns clear error when API key is missing', () => {
  const result = validateAdminSyncConfig({} as NodeJS.ProcessEnv);
  assert.equal(result, 'Missing FOOTBALL_DATA_API_KEY');
});

test('validateAdminSyncConfig returns null when API key exists', () => {
  const result = validateAdminSyncConfig({ FOOTBALL_DATA_API_KEY: 'abc' } as NodeJS.ProcessEnv);
  assert.equal(result, null);
});

test('formatAdminSyncError returns structured message + details with failed step', () => {
  const result = formatAdminSyncError('syncFixtures', new Error('football-data error 429'));

  assert.equal(result.message, 'Fixture sync failed.');
  assert.match(result.details, /Step syncFixtures: football-data error 429/);
});
