import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '@/lib/prisma';
import { saveUserCountry } from '@/lib/onboarding-country';

test('saveUserCountry returns 404 when country does not exist', async () => {
  const originalCountryFindUnique = prisma.country.findUnique;
  prisma.country.findUnique = (async () => null) as any;

  const result = await saveUserCountry('user-1', 'cm8q9rq7m0000abc123456789');

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 404);

  prisma.country.findUnique = originalCountryFindUnique;
});

test('saveUserCountry persists selected country', async () => {
  const originalCountryFindUnique = prisma.country.findUnique;
  const originalProfileUpdate = prisma.profile.update;

  let updatedCountryId = '';

  prisma.country.findUnique = (async () => ({ id: 'cm8q9rq7m0000abc123456789' })) as any;
  prisma.profile.update = (async ({ data }: any) => {
    updatedCountryId = data.countryId;
    return { id: 'profile-1', countryId: data.countryId };
  }) as any;

  const result = await saveUserCountry('user-1', 'cm8q9rq7m0000abc123456789');

  assert.equal(result.ok, true);
  assert.equal(updatedCountryId, 'cm8q9rq7m0000abc123456789');

  prisma.country.findUnique = originalCountryFindUnique;
  prisma.profile.update = originalProfileUpdate;
});
