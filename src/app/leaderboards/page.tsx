import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeaderboardsPage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallback = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallback?.id;

  const [rows, competitions] = await Promise.all([
    prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 30, include: { user: { select: { id: true } } } }),
    prisma.competition.findMany({ where: { visible: true, active: true }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Classement</p>
        <h1 className="mt-1 text-3xl font-black">Ranking global</h1>
        <p className="mt-1 text-sm font-semibold">Repérez rapidement votre position.</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <h2 className="section-title">Filtre compétition (POC)</h2>
        <p className="mt-1 text-sm text-zinc-200">Global actif. Compétitions disponibles: {competitions.map((c) => c.name).join(' • ')}</p>
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
                  <p className="text-xs text-zinc-300">{row.totalPredictions} pronos • {row.exactHits} scores exacts</p>
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
