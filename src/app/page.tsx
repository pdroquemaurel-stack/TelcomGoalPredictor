import Link from 'next/link';
import { redirect } from 'next/navigation';
import recapBackground from '../../backgrounds/daily-recap-pitch.png';
import { prisma } from '@/lib/prisma';
import { requireOnboardedUser } from '@/lib/player-access';

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

  if (recapUpdate.count === 0) {
    redirect('/predictions');
  }

  const [yesterdayPredictions, totalGlobalPlayers, totalCountryPlayers] = await Promise.all([
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

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${recapBackground.src})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/90" aria-hidden />

      <section className="relative z-10 flex h-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-black/35 p-5 shadow-2xl backdrop-blur-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Daily recap</p>
            <h1 className="mt-2 text-2xl font-black">Bonjour {getFirstName(profile.displayName)}</h1>
            <p className="mt-1 text-sm text-zinc-100">C’est l’heure du bilan !</p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-300">Mes pronos d’hier :</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-100">
              <li>Bon prono : {goodPredictions} / {yesterdayPredictions.length}</li>
              <li>Exact : {exactPredictions}</li>
              <li>TOTAL Points : {yesterdayPoints}</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-300">Mes classements :</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-100">
              <li>Général : {globalRank}ème (top {formatTopPercent(globalRank, totalGlobalPlayers)}%)</li>
              <li>
                Pays : {countryRank ? `${countryRank}ème (top ${formatTopPercent(countryRank, totalCountryPlayers)}%)` : 'Non disponible'}
              </li>
            </ul>
          </div>

          <Link href="/predictions" className="cta-primary block w-full text-center">
            À vos pronos
          </Link>
        </div>
      </section>
    </main>
  );
}
