import { prisma } from '@/lib/prisma';

export async function saveUserCountry(userId: string, countryId: string) {
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } });
  if (!country) {
    return { ok: false as const, status: 404, message: 'Country not found.' };
  }

  await prisma.profile.update({
    where: { userId },
    data: { countryId: country.id },
  });

  return { ok: true as const };
}
