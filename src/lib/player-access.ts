import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/session-user';

export async function requireOnboardedUser() {
  const me = await requireAuthenticatedUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: me.id },
    select: {
      userId: true,
      displayName: true,
      totalPoints: true,
      totalPredictions: true,
      exactHits: true,
      accuracyPct: true,
      bestStreak: true,
      currentStreak: true,
      countryId: true,
      country: { select: { id: true, name: true, code: true } },
    },
  });

  if (!profile) {
    redirect('/auth/signin');
  }

  if (!profile.countryId) {
    redirect('/onboarding/country');
  }

  return { me, profile };
}

export async function getOnboardingStatus() {
  const me = await requireAuthenticatedUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: me.id },
    select: { countryId: true },
  });

  return {
    userId: me.id,
    hasCountry: Boolean(profile?.countryId),
  };
}
