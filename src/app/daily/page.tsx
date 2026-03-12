import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatMatchDateTime } from '@/lib/date-format';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';

export const dynamic = 'force-dynamic';

export default async function DailyPage({ searchParams }: { searchParams?: { view?: string } }) {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id ?? '';
  const daily = await getDailyFixturesForUser(userId);
  const showPast = searchParams?.view === 'past';

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Prono du jour</p>
        <h1 className="mt-1 text-2xl font-black">Matchs des {daily.upcomingDays} prochains jours</h1>
      </header>

      <section className="card">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/daily" className={`rounded-xl px-3 py-2 text-center text-xs font-black ${!showPast ? 'bg-brand text-black' : 'border border-white/20'}`}>
            À venir
          </Link>
          <Link href="/daily?view=past" className={`rounded-xl px-3 py-2 text-center text-xs font-black ${showPast ? 'bg-brand text-black' : 'border border-white/20'}`}>
            Passés
          </Link>
        </div>
      </section>

      {!showPast && daily.upcomingGroups.map((group) => (
        <section key={group.label} className="card">
          <h2 className="section-title">{group.label}</h2>
          <div className="mt-3 space-y-2">
            {group.fixtures.map((fixture) => (
              <FixturePredictionCard
                key={fixture.id}
                away={fixture.away}
                awayLogoUrl={fixture.awayLogoUrl}
                competition={fixture.competition}
                editable
                fixtureId={fixture.id}
                home={fixture.home}
                homeLogoUrl={fixture.homeLogoUrl}
                kickoff={fixture.kickoff}
                odds={fixture.odds}
                savedPrediction={fixture.savedPrediction}
              />
            ))}
            {group.fixtures.length === 0 && <p className="text-sm text-zinc-300">Aucun match disponible.</p>}
          </div>
        </section>
      ))}

      {!showPast && daily.upcomingGroups.length === 0 && (
        <section className="card">
          <p className="text-sm text-zinc-300">Aucun match à venir dans la fenêtre configurée.</p>
        </section>
      )}

      {showPast && daily.pastGroups.map((group) => (
        <section key={group.label} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">{group.label}</h2>
            <p className="text-xs font-black text-brand">+{group.totalPoints} pts</p>
          </div>
          <div className="space-y-3">
            {group.fixtures.map((fixture) => (
              <article key={fixture.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-3 text-sm">
                <p className="text-[11px] text-zinc-400">{formatMatchDateTime(fixture.kickoff)} • {fixture.competition}</p>
                <p className="mt-1 font-black">{fixture.home} {fixture.result.homeScore} - {fixture.result.awayScore} {fixture.away}</p>
                <p className="mt-1 text-zinc-300">Ton prono : {fixture.prediction.homeScore} - {fixture.prediction.awayScore}</p>
                <p className="text-brand">Points : {fixture.points}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      {showPast && daily.pastGroups.length === 0 && (
        <section className="card">
          <p className="text-sm text-zinc-300">Aucun match passé pronostiqué pour le moment.</p>
        </section>
      )}

      <PlayerNav />
    </main>
  );
}
