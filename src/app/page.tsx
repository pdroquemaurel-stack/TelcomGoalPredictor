import Image from 'next/image';
import Link from 'next/link';
import recapBackground from '../../backgrounds/daily-recap-pitch.png';
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

function getUtcDayRange(offsetDays = 0) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays + 1, 0, 0, 0, 0));
  return { start, end };
}

function formatTopPercent(rank: number, total: number) {
  if (!total) return '100';
  return Math.max(1, Math.round((rank / total) * 100)).toString();
}

export default async function HomePage() {
  const { me, profile } = await requireOnboardedUser();
  const userId = me.id;
  const todayRange = getUtcDayRange(0);
  const yesterdayRange = getUtcDayRange(-1);

  const recapUpdate = await prisma.profile.updateMany({
    where: {
      userId,
      OR: [
        { lastDailyRecapSeenAt: null },
        { lastDailyRecapSeenAt: { lt: todayRange.start } },
      ],
    },
    data: {
      lastDailyRecapSeenAt: new Date(),
    },
  });

  const [daily, availableChallenges, config, yesterdayPredictions, totalGlobalPlayers, totalCountryPlayers] = await Promise.all([
    getDailyFixturesForUser(userId),
    prisma.challenge.count({ where: getActiveChallengesFilter() }),
    getAppConfig(),
    prisma.prediction.findMany({
      where: {
        userId,
        fixture: {
          utcKickoff: {
            gte: yesterdayRange.start,
            lt: yesterdayRange.end,
          },
        },
      },
      select: {
        pointsAwarded: true,
        homeScore: true,
        awayScore: true,
        fixture: {
          select: {
            homeScore: true,
            awayScore: true,
          },
        },
      },
    }),
    prisma.profile.count(),
    profile.countryId ? prisma.profile.count({ where: { countryId: profile.countryId } }) : Promise.resolve(0),
  ]);

  const higherGlobalPlayers = await prisma.profile.count({
    where: {
      OR: [
        { totalPoints: { gt: profile.totalPoints } },
        {
          totalPoints: profile.totalPoints,
          userId: { lt: userId },
        },
      ],
    },
  });

  const globalRank = higherGlobalPlayers + 1;

  const countryRank = profile.countryId
    ? (await prisma.profile.count({
      where: {
        countryId: profile.countryId,
        OR: [
          { totalPoints: { gt: profile.totalPoints } },
          {
            totalPoints: profile.totalPoints,
            userId: { lt: userId },
          },
        ],
      },
    })) + 1
    : null;

  const goodPredictions = yesterdayPredictions.filter((prediction) => prediction.pointsAwarded > 0).length;
  const exactPredictions = yesterdayPredictions.filter((prediction) => (
    prediction.fixture.homeScore !== null
    && prediction.fixture.awayScore !== null
    && prediction.homeScore === prediction.fixture.homeScore
    && prediction.awayScore === prediction.fixture.awayScore
  )).length;
  const yesterdayPoints = yesterdayPredictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0);

  const shouldShowDailyRecap = recapUpdate.count > 0;

  const dailyFixtures = daily.today;
  const completedToday = dailyFixtures.filter((fixture) => fixture.savedPrediction).length;
  const totalToday = dailyFixtures.length;
  const nextFixture = dailyFixtures.find((fixture) => !fixture.savedPrediction) ?? dailyFixtures[0] ?? null;
  const hasOpen = totalToday > 0;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      {shouldShowDailyRecap && (
        <section className="relative overflow-hidden rounded-3xl border border-brand/40 bg-zinc-950 shadow-2xl">
          <Image
            src={recapBackground}
            alt="Fond daily recap"
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/65 to-black/90" />
          <div className="relative z-10 space-y-4 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Daily recap</p>
              <h2 className="mt-2 text-2xl font-black">Bonjour {getFirstName(profile.displayName)}</h2>
              <p className="mt-1 text-sm text-zinc-100">C’est l’heure du bilan !</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-black/35 p-4 backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-300">Mes pronos d’hier</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-100">
                <li>Bon prono : {goodPredictions} / {yesterdayPredictions.length}</li>
                <li>Exact : {exactPredictions}</li>
                <li>TOTAL Points : {yesterdayPoints}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/20 bg-black/35 p-4 backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-300">Mes classements</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-100">
                <li>Général : {globalRank}ème (top {formatTopPercent(globalRank, totalGlobalPlayers)}%)</li>
                <li>
                  Pays : {countryRank ? `${countryRank}ème (top ${formatTopPercent(countryRank, totalCountryPlayers)}%)` : 'Non disponible'}
                </li>
              </ul>
            </div>

            <Link href="/daily" className="cta-primary block w-full text-center">
              À vos pronos
            </Link>
          </div>
        </section>
      )}

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
