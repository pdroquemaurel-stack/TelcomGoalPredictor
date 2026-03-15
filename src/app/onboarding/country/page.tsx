import { redirect } from 'next/navigation';
import { CountryOnboardingForm } from '@/components/country-onboarding-form';
import { prisma } from '@/lib/prisma';
import { getOnboardingStatus } from '@/lib/player-access';

export const dynamic = 'force-dynamic';

export default async function CountryOnboardingPage() {
  const status = await getOnboardingStatus();

  if (status.hasCountry) {
    redirect('/');
  }

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-8">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Bienvenue</p>
        <h1 className="mt-1 text-2xl font-black">Choisis ton pays</h1>
        <p className="mt-2 text-sm font-semibold">On personnalise ton expérience, les classements et les compétitions locales.</p>
      </header>
      <CountryOnboardingForm countries={countries} />
    </main>
  );
}
