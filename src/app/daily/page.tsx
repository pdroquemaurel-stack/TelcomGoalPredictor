import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id ?? '';
  const daily = await getDailyFixturesForUser(userId);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Pronostics quotidiens</p>
        <h1 className="mt-1 text-2xl font-black">Aujourd’hui et demain</h1>
      </header>
      {([
        ['Aujourd’hui', daily.today],
        ['Demain', daily.tomorrow],
      ] as const).map(([label, fixtures]) => (
        <section key={label} className="card">
          <h2 className="section-title">{label}</h2>
          <div className="mt-3 space-y-2">
            {fixtures.map((fixture) => (
              <article key={fixture.id} className="rounded-2xl border border-white/15 bg-black p-3">
                <p className="text-xs text-zinc-400">{new Date(fixture.kickoff).toLocaleString()} • {fixture.competition}</p>
                <p className="mt-1 font-bold">{fixture.home} vs {fixture.away}</p>
                <p className="text-xs font-semibold text-brand">{fixture.state === 'saved' ? 'Déjà pronostiqué' : 'Ouvert aux pronostics'}</p>
                <Link href={`/predictions?competitionId=${fixture.competitionId}`} className="mt-2 inline-block text-xs font-black uppercase text-brand">Pronostiquer</Link>
              </article>
            ))}
            {fixtures.length === 0 && <p className="text-sm text-zinc-300">Aucun match disponible.</p>}
          </div>
        </section>
      ))}
      <PlayerNav />
    </main>
  );
}
