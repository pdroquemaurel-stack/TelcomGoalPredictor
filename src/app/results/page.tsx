import Link from 'next/link';
import { requireOnboardedUser } from '@/lib/player-access';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResultsPage() {
  await requireOnboardedUser();
  const fixtures = await prisma.fixture.findMany({
    where: { homeScore: { not: null }, awayScore: { not: null } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { utcKickoff: 'desc' },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="ui-page-header">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Résultats</p>
        <h1 className="mt-1 text-3xl font-black">Matchs terminés</h1>
        <p className="mt-1 text-sm font-semibold">Retrouve les derniers scores officiels et reviens sur tes pronostics.</p>
      </header>

      {fixtures.length === 0 ? (
        <section className="ui-empty-state">
          Aucun match terminé pour le moment. Reviens plus tard ou fais tes pronostics sur les prochaines affiches.
          <Link className="mt-3 block w-fit rounded-xl bg-brand px-3 py-2 text-xs font-black text-black" href="/predictions">Voir les matchs à venir</Link>
        </section>
      ) : (
        <section className="space-y-2">
          {fixtures.map((fixture) => (
            <article className="card" key={fixture.id}>
              <p className="font-bold">{fixture.homeTeam.name} {fixture.homeScore} - {fixture.awayScore} {fixture.awayTeam.name}</p>
              <p className="mt-1 text-xs text-zinc-400">Score validé</p>
            </article>
          ))}
        </section>
      )}

      <PlayerNav />
    </main>
  );
}
