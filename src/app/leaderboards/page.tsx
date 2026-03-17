import Link from 'next/link';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { requireOnboardedUser } from '@/lib/player-access';
import { LeaderboardPeriodFilter, getPeriodStart, toRankedRows } from '@/lib/leaderboard-period';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Scope = 'global' | 'country';

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams?: { scope?: string; period?: string };
}) {
  const { me, profile: meProfile } = await requireOnboardedUser();
  const userId = me.id;
  const scope = (searchParams?.scope as Scope) === 'country' ? 'country' : 'global';
  const period = (searchParams?.period as LeaderboardPeriodFilter) || 'all-time';
  const periodStart = getPeriodStart(period);

  const where = scope === 'country'
    ? { countryId: meProfile.countryId ?? '__none__' }
    : undefined;

  const profiles = await prisma.profile.findMany({
    where,
    include: {
      user: {
        select: {
          username: true,
          predictions: {
            where: periodStart
              ? {
                fixture: { utcKickoff: { gte: periodStart } },
              }
              : undefined,
            include: { fixture: { select: { fixtureState: true } } },
          },
        },
      },
      country: true,
    },
  });

  const rankedRows = toRankedRows(profiles.map((row) => {
    const settledPredictions = row.user.predictions.filter((prediction) => prediction.fixture.fixtureState === 'SETTLED');
    const points = period === 'all-time'
      ? row.totalPoints
      : settledPredictions.reduce((total, prediction) => total + prediction.pointsAwarded, 0);

    const exactHits = period === 'all-time'
      ? row.exactHits
      : settledPredictions.filter((prediction) => prediction.pointsAwarded >= 3).length;

    return {
      userId: row.userId,
      displayName: row.displayName,
      username: row.user.username,
      countryName: row.country?.name ?? 'Pays non renseigné',
      totalPredictions: period === 'all-time' ? row.totalPredictions : settledPredictions.length,
      points,
      exactHits,
    };
  })).slice(0, 30);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="ui-page-header">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Classement</p>
        <h1 className="mt-1 text-3xl font-black">Top joueurs</h1>
        <p className="mt-1 text-sm font-semibold">Compare ta performance en global ou dans ton pays.</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <h2 className="section-title">Filtres</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['all-time', 'weekly', 'monthly'] as const).map((value) => (
            <Link href={`/leaderboards?scope=${scope}&period=${value}`} key={value} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${period === value ? 'bg-brand text-black' : 'border border-white/20'}`}>
              {value === 'all-time' ? 'Depuis le début' : value === 'weekly' ? '7 jours' : '30 jours'}
            </Link>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link href={`/leaderboards?scope=global&period=${period}`} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'global' ? 'bg-brand text-black' : 'border border-white/20'}`}>Global</Link>
          <Link href={`/leaderboards?scope=country&period=${period}`} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'country' ? 'bg-brand text-black' : 'border border-white/20'}`}>Mon pays</Link>
        </div>
      </section>

      <section className="space-y-2">
        {rankedRows.length === 0 && <article className="ui-empty-state">Aucune donnée de classement sur cette période.</article>}
        {rankedRows.map((row) => {
          const isMe = row.userId === userId;
          return (
            <article key={row.userId} className={`card flex items-center justify-between p-3 ${isMe ? 'border-brand bg-brand/10' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${isMe ? 'bg-brand text-black' : 'bg-zinc-800 text-white'}`}>#{row.rank}</span>
                <div>
                  <p className="font-black">{row.displayName} {isMe ? '(Moi)' : ''}</p>
                  <p className="text-xs text-zinc-300">{row.countryName} • {row.totalPredictions} pronos</p>
                </div>
              </div>
              <p className="text-lg font-black text-brand">{row.points} pts</p>
            </article>
          );
        })}
      </section>

      <PlayerNav />
    </main>
  );
}
