import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id;

  const competitions = await prisma.competition.findMany({
    where: { visible: true, active: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      fixtures: {
        where: { predictionEnabled: true, visible: true },
        include: { predictions: { where: { userId: userId ?? '' }, select: { id: true } } },
      },
    },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black shadow-xl shadow-orange-500/30">
        <p className="text-xs font-black uppercase tracking-[0.18em]">FIFA World Cup 2026 POC</p>
        <h1 className="mt-2 text-3xl font-black">Compétitions à pronostiquer</h1>
        <p className="mt-2 text-sm font-semibold">Prédisez les scores, suivez votre progression, grimpez au classement.</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <h2 className="section-title">Barème simple</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• Score exact = <strong>3 pts</strong></li>
          <li>• Bon vainqueur / nul = <strong>1 pt</strong></li>
          <li>• Mauvais pronostic = <strong>0 pt</strong></li>
        </ul>
      </section>

      <section className="space-y-3">
        {competitions.map((competition) => {
          const total = competition.fixtures.length;
          const predicted = competition.fixtures.filter((fixture) => fixture.predictions.length > 0).length;
          const remaining = Math.max(total - predicted, 0);

          return (
            <article key={competition.id} className={`card ${competition.code === 'WC2026' ? 'border-brand' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{competition.code === 'WC2026' ? 'Compétition vedette' : 'Compétition'}</p>
                  <h2 className="text-xl font-black">{competition.name}</h2>
                </div>
                {competition.code === 'WC2026' && <span className="game-chip bg-brand text-black">FEATURED</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Matchs</p><p className="text-lg font-black">{total}</p></div>
                <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Pronos faits</p><p className="text-lg font-black text-brand">{predicted}</p></div>
                <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Restants</p><p className="text-lg font-black">{remaining}</p></div>
              </div>
              <Link href={`/predictions?competitionId=${competition.id}`} className="cta-primary mt-3 inline-block w-full text-center">
                Ouvrir la compétition
              </Link>
            </article>
          );
        })}
      </section>

      <PlayerNav />
    </main>
  );
}
