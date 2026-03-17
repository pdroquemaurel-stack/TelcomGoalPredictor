import Link from 'next/link';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { requireOnboardedUser } from '@/lib/player-access';
import { formatMatchDateTime } from '@/lib/date-format';
import { getAppConfig } from '@/lib/app-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getFirstName(value: string) {
  return value.split(' ').filter(Boolean)[0] ?? 'Joueur';
}

export default async function HomePage() {
  const { me, profile } = await requireOnboardedUser();
  const userId = me.id;

  const [daily, availableChallenges, config] = await Promise.all([
    getDailyFixturesForUser(userId),
    prisma.challenge.count({ where: getActiveChallengesFilter() }),
    getAppConfig(),
  ]);

  const dailyFixtures = daily.today;
  const completedToday = dailyFixtures.filter((fixture) => fixture.savedPrediction).length;
  const totalToday = dailyFixtures.length;
  const nextFixture = dailyFixtures.find((fixture) => !fixture.savedPrediction) ?? dailyFixtures[0] ?? null;
  const hasOpen = totalToday > 0;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="card border-brand bg-brand/10">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{config.appName}</p>
        <h1 className="mt-1 text-2xl font-black">Salut {getFirstName(profile.displayName)} 👋</h1>
        <p className="mt-2 text-sm text-zinc-200">{config.welcomeMessage}</p>
      </header>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Progression</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-3">
            <p className="text-lg font-black text-brand">{profile.totalPoints}</p>
            <p className="text-[11px] text-zinc-300">Points</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-3">
            <p className="text-lg font-black">{completedToday}/{totalToday}</p>
            <p className="text-[11px] text-zinc-300">Pronos du jour</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-3">
            <p className="text-lg font-black">{Math.round(profile.accuracyPct)}%</p>
            <p className="text-[11px] text-zinc-300">Précision</p>
          </div>
        </div>
      </section>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Prochaine échéance</p>
        {nextFixture ? (
          <>
            <p className="mt-2 text-base font-black">{nextFixture.home} vs {nextFixture.away}</p>
            <p className="text-xs text-zinc-300">{formatMatchDateTime(nextFixture.kickoff)} • {nextFixture.competition}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-300">Aucun match ouvert pour le moment. Reviens bientôt.</p>
        )}
        <Link href="/predictions" className="cta-primary mt-4 block w-full text-center">
          Pronostiquer maintenant
        </Link>
      </section>

      <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{config.appTagline}</p>
        <p className="mt-1 text-xs text-zinc-300">{config.homeBannerMessage}</p>
      </section>

      {config.showChallengesBlock && <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Compétitions & challenges</p>
        <p className="mt-2 text-sm text-zinc-100">{availableChallenges} challenge(s) actif(s)</p>
        <p className="text-xs text-zinc-300">{hasOpen ? 'Des matchs sont disponibles aujourd’hui.' : 'Pas de match ouvert actuellement.'}</p>
      </section>}

      {config.showLeaderboardBlock && <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Classement</p>
        <p className="mt-2 text-sm text-zinc-100">Compare ta progression avec les autres joueurs.</p>
        <Link href="/leaderboards" className="mt-3 inline-block text-sm font-bold text-brand">Voir le leaderboard →</Link>
      </section>}

      {config.showShopBlock && <section className="card">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Boutique</p>
        <p className="mt-2 text-sm text-zinc-100">Boosters et avantages sponsorisés disponibles.</p>
        <Link href="/shop" className="mt-3 inline-block text-sm font-bold text-brand">Ouvrir le shop →</Link>
      </section>}

      <PlayerNav />
    </main>
  );
}
