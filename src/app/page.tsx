import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { formatMatchDateTime } from '@/lib/date-format';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id ?? '';

  const [daily, challenges] = await Promise.all([
    getDailyFixturesForUser(userId),
    prisma.challenge.findMany({
      where: getActiveChallengesFilter(),
      include: { competitions: { include: { competition: true } } },
      orderBy: [{ startDate: 'asc' }],
      take: 8,
    }),
  ]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black shadow-xl shadow-orange-500/30">
        <p className="text-xs font-black uppercase tracking-[0.18em]">TelcomGoalPredictor • POC</p>
        <h1 className="mt-2 text-3xl font-black">Prono du jour & challenges</h1>
        <p className="mt-2 text-sm font-semibold">Reviens chaque jour, joue les challenges actifs, et grimpe au classement.</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Matchs du jour & demain</h2>
          <Link href="/daily" className="text-xs font-black uppercase text-brand">Voir tout</Link>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          {([
            { label: 'Aujourd’hui', fixtures: daily.today },
            { label: 'Demain', fixtures: daily.tomorrow },
          ]).map(({ label, fixtures }) => (
            <div key={label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{label}</p>
              <div className="mt-2 space-y-2">
                {fixtures.slice(0, 3).map((fixture) => (
                  <article key={fixture.id} className="rounded-2xl border border-white/15 bg-black p-3">
                    <p className="text-xs text-zinc-400">{formatMatchDateTime(fixture.kickoff)} • {fixture.competition}</p>
                    <p className="mt-1 font-bold">{fixture.home} vs {fixture.away}</p>
                  </article>
                ))}
                {fixtures.length === 0 && <p className="text-zinc-300">Aucun match pronosticable.</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Challenges en cours</h2>
          <Link href="/challenges" className="text-xs font-black uppercase text-brand">Tout voir</Link>
        </div>
        {challenges.map((challenge) => (
          <article key={challenge.id} className="card">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{challenge.competitions.map((item) => item.competition.name).join(' • ') || 'Multi-compétitions'}</p>
            <h3 className="text-lg font-black">{challenge.name}</h3>
            <p className="mt-1 text-xs text-zinc-300">{new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()}</p>
            {challenge.reward && <p className="mt-1 text-sm font-bold text-brand">Lot: {challenge.reward}</p>}
            <Link href={`/challenges/${challenge.slug}`} className="cta-primary mt-3 inline-block w-full text-center">Voir le challenge</Link>
          </article>
        ))}
        {challenges.length === 0 && <article className="card text-sm text-zinc-300">Aucun challenge actif pour le moment.</article>}
      </section>

      <PlayerNav />
    </main>
  );
}
