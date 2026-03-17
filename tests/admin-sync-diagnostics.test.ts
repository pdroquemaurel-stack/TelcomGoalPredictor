import test from 'node:test';
import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import { formatAdminSyncError, validateAdminSyncConfig } from '@/lib/admin-sync-diagnostics';

test('validateAdminSyncConfig returns clear error when API key is missing', () => {
  const result = validateAdminSyncConfig({} as NodeJS.ProcessEnv);
  assert.equal(result, 'Missing FOOTBALL_DATA_API_KEY');
});

test('validateAdminSyncConfig returns null when API key exists', () => {
  const result = validateAdminSyncConfig({ FOOTBALL_DATA_API_KEY: 'abc' } as NodeJS.ProcessEnv);
  assert.equal(result, null);
});

test('formatAdminSyncError classifies provider error with explicit code', () => {
  const result = formatAdminSyncError('syncFixtures', new Error('football-data error 429'));

  assert.equal(result.code, 'EXTERNAL_PROVIDER_ERROR');
  assert.equal(result.message, 'Erreur du provider de données football.');
  assert.match(result.details, /Step syncFixtures: football-data error 429/);
});

test('formatAdminSyncError classifies zod payload mismatch as validation error', () => {
  const zodError = new ZodError([{ code: 'custom', path: ['fixturesProcessed'], message: 'invalid', fatal: false } as any]);
  const result = formatAdminSyncError('responseContract', zodError);

  assert.equal(result.code, 'VALIDATION_ERROR');
  assert.equal(result.message, 'Validation du contrat de sync échouée.');
  assert.match(result.details, /fixturesProcessed: invalid/);
});
