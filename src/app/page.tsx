import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getInitials(value: string) {
  return value.split(' ').filter(Boolean).slice(0, 2).map((item) => item[0]?.toUpperCase() ?? '').join('') || 'J';
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true, email: true } });
  const userId = me ?? fallbackUser?.id ?? '';

  const [profile, daily, availableChallenges] = await Promise.all([
    userId ? prisma.profile.findUnique({ where: { userId } }) : null,
    getDailyFixturesForUser(userId),
    prisma.challenge.count({ where: getActiveChallengesFilter() }),
  ]);

  const displayName = profile?.displayName ?? fallbackUser?.email ?? 'Joueur';
  const dailyFixtures = daily.today;
  const completedToday = dailyFixtures.filter((fixture) => fixture.savedPrediction).length;
  const totalToday = dailyFixtures.length;

  const ratio = profile?.totalPredictions
    ? Math.round((profile.exactHits / profile.totalPredictions) * 100)
    : Math.round(profile?.accuracyPct ?? 0);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="card border-brand bg-brand/10">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white text-lg font-black text-black">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Avatar joueur" className="h-14 w-14 rounded-full object-cover" src={profile.avatarUrl} />
            ) : (
              getInitials(displayName)
            )}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Joueur</p>
            <h1 className="text-xl font-black">{displayName}</h1>
          </div>
        </div>
      </header>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Ratio de victoire</p>
        <p className="mt-1 text-3xl font-black text-brand">{ratio}%</p>
      </section>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Challenges du jour</p>
        <p className="mt-1 text-2xl font-black">{completedToday} / {totalToday}</p>
        <p className="text-xs text-zinc-300">remplis / à remplir</p>
      </section>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Challenges disponibles</p>
        <p className="mt-1 text-2xl font-black">{availableChallenges}</p>
      </section>

      <PlayerNav />
    </main>
  );
}
