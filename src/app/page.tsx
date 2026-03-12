import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { AuthLanding } from '@/components/auth-landing';
import { OnboardingModal } from '@/components/onboarding-modal';
import { authOptions } from '@/lib/auth';
import { AFRICAN_COUNTRIES } from '@/lib/countries';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? '')
    .join('') || 'J';
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return <AuthLanding />;
  }

  const [profile, competitionsCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, include: { country: true } }),
    prisma.competition.count({ where: { active: true, visible: true } }),
  ]);

  const leaderboardAheadCount = profile
    ? await prisma.profile.count({ where: { totalPoints: { gt: profile.totalPoints } } })
    : 0;

  const displayName = profile?.displayName ?? session?.user?.name ?? session?.user?.email ?? 'Joueur';
  const rank = profile ? leaderboardAheadCount + 1 : null;
  const accuracy = profile?.totalPredictions
    ? Math.round((profile.exactHits / profile.totalPredictions) * 100)
    : Math.round(profile?.accuracyPct ?? 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col space-y-4 px-4 pb-28 pt-5">
      {!profile?.onboardingCompleted && (
        <OnboardingModal
          countries={AFRICAN_COUNTRIES}
          defaultCountryCode={profile?.country?.code ?? undefined}
          displayName={displayName}
        />
      )}

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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Bienvenue</p>
            <h1 className="text-xl font-black">{displayName}</h1>
            <p className="text-xs text-zinc-200">{profile?.country?.name ?? 'Pays non défini'}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <article className="card">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Points</p>
          <p className="mt-1 text-2xl font-black text-brand">{profile?.totalPoints ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Rang</p>
          <p className="mt-1 text-2xl font-black">{rank ? `#${rank}` : '—'}</p>
        </article>
        <article className="card">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Pronos</p>
          <p className="mt-1 text-2xl font-black">{profile?.totalPredictions ?? 0}</p>
        </article>
        <article className="card">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Scores exacts</p>
          <p className="mt-1 text-2xl font-black">{profile?.exactHits ?? 0}</p>
        </article>
      </section>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Précision</p>
        <p className="mt-1 text-3xl font-black text-brand">{accuracy}%</p>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Accès rapides</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/challenges" className="card border-white/20 p-3 text-sm font-black">Compétitions ({competitionsCount})</Link>
          <Link href="/predictions" className="card border-white/20 p-3 text-sm font-black">Pronostics du jour</Link>
          <Link href="/leaderboards" className="card border-white/20 p-3 text-sm font-black">Leaderboard</Link>
          <Link href="/profile" className="card border-white/20 p-3 text-sm font-black">Mon profil</Link>
        </div>
      </section>

      <PlayerNav />
    </main>
  );
}
