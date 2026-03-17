import Link from 'next/link';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { requireOnboardedUser } from '@/lib/player-access';
import { LeaderboardPeriodFilter, getPeriodStart, toRankedRows } from '@/lib/leaderboard-period';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Scope = 'global' | 'country' | 'friends';

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams?: { scope?: string; period?: string };
}) {
  const { me, profile: meProfile } = await requireOnboardedUser();
  const userId = me.id;
  const scope = (searchParams?.scope as Scope) || 'global';
  const period = (searchParams?.period as LeaderboardPeriodFilter) || 'all-time';
  const periodStart = getPeriodStart(period);

  const friendshipLinks = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = friendshipLinks.map((link) => (link.requesterId === userId ? link.addresseeId : link.requesterId));

  const where = scope === 'country'
    ? { countryId: meProfile.countryId ?? '__none__' }
    : scope === 'friends'
      ? { userId: { in: [userId, ...friendIds].filter(Boolean) as string[] } }
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
  }));

  const TOP_ROWS_LIMIT = 10;
  const topRows = rankedRows.slice(0, TOP_ROWS_LIMIT);
  const meRow = rankedRows.find((row) => row.userId === userId);
  const isMeInTopRows = topRows.some((row) => row.userId === userId);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Classement</p>
        <h1 className="mt-1 text-3xl font-black">Leaderboard joueur</h1>
        <p className="mt-1 text-sm font-semibold">Période: {period === 'all-time' ? 'All-time' : period === 'weekly' ? '7 jours' : '30 jours'}.</p>
        <p className="mt-3 text-center text-xl font-black text-orange-500">{rankedRows.length} joueurs classés</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <h2 className="section-title">Filtres</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['all-time', 'weekly', 'monthly'] as const).map((value) => (
            <Link href={`/leaderboards?scope=${scope}&period=${value}`} key={value} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${period === value ? 'bg-brand text-black' : 'border border-white/20'}`}>
              {value === 'all-time' ? 'All-time' : value === 'weekly' ? 'Weekly' : 'Monthly'}
            </Link>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Link href={`/leaderboards?scope=global&period=${period}`} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'global' ? 'bg-brand text-black' : 'border border-white/20'}`}>Global</Link>
          <Link href={`/leaderboards?scope=country&period=${period}`} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'country' ? 'bg-brand text-black' : 'border border-white/20'}`}>Pays</Link>
          <Link href={`/leaderboards?scope=friends&period=${period}`} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'friends' ? 'bg-brand text-black' : 'border border-white/20'}`}>Amis</Link>
        </div>
      </section>

      <section className="space-y-2">
        {rankedRows.length === 0 && <article className="card text-sm text-zinc-300">Aucune donnée de classement sur cette période.</article>}
        {topRows.map((row) => {
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
        {!isMeInTopRows && meRow && (
          <>
            <p className="px-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">…</p>
            <article className="card flex items-center justify-between border-brand bg-brand/10 p-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black text-black">#{meRow.rank}</span>
                <div>
                  <p className="font-black">{meRow.displayName} (Moi)</p>
                  <p className="text-xs text-zinc-300">{meRow.countryName} • {meRow.totalPredictions} pronos</p>
                </div>
              </div>
              <p className="text-lg font-black text-brand">{meRow.points} pts</p>
            </article>
          </>
        )}
      </section>

      <PlayerNav />
    </main>
  );
}
