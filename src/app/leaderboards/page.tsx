import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Scope = 'global' | 'country' | 'friends';

export default async function LeaderboardsPage({ searchParams }: { searchParams?: { scope?: string } }) {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallback = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallback?.id;
  const scope = (searchParams?.scope as Scope) || 'global';

  const meProfile = userId ? await prisma.profile.findUnique({ where: { userId } }) : null;
  const friendshipLinks = userId
    ? await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    })
    : [];

  const friendIds = friendshipLinks.map((link) => (link.requesterId === userId ? link.addresseeId : link.requesterId));

  const where = scope === 'country'
    ? { countryId: meProfile?.countryId ?? '__none__' }
    : scope === 'friends'
      ? { userId: { in: [userId, ...friendIds].filter(Boolean) as string[] } }
      : undefined;

  const rows = await prisma.profile.findMany({
    where,
    orderBy: { totalPoints: 'desc' },
    take: 30,
    include: { user: { select: { id: true } }, country: true },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Classement</p>
        <h1 className="mt-1 text-3xl font-black">Ranking {scope === 'global' ? 'global' : scope === 'country' ? 'pays' : 'amis'}</h1>
        <p className="mt-1 text-sm font-semibold">Repérez rapidement votre position.</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <h2 className="section-title">Type de classement</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Link href="/leaderboards?scope=global" className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'global' ? 'bg-brand text-black' : 'border border-white/20'}`}>Global</Link>
          <Link href="/leaderboards?scope=country" className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'country' ? 'bg-brand text-black' : 'border border-white/20'}`}>Pays</Link>
          <Link href="/leaderboards?scope=friends" className={`rounded-xl px-3 py-2 text-center text-xs font-black ${scope === 'friends' ? 'bg-brand text-black' : 'border border-white/20'}`}>Amis</Link>
        </div>
      </section>

      <section className="space-y-2">
        {rows.map((row, index) => {
          const isMe = row.userId === userId;
          return (
            <article key={row.id} className={`card flex items-center justify-between p-3 ${isMe ? 'border-brand bg-brand/10' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${isMe ? 'bg-brand text-black' : 'bg-zinc-800 text-white'}`}>#{index + 1}</span>
                <div>
                  <p className="font-black">{row.displayName} {isMe ? '(Moi)' : ''}</p>
                  <p className="text-xs text-zinc-300">{row.country?.name ?? 'Pays non renseigné'} • {row.totalPredictions} pronos</p>
                </div>
              </div>
              <p className="text-lg font-black text-brand">{row.totalPoints} pts</p>
            </article>
          );
        })}
      </section>

      <PlayerNav />
    </main>
  );
}
