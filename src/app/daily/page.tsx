import { PlayerNav } from '@/components/player-nav';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';
import { requireAuthenticatedUser } from '@/lib/session-user';

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const me = await requireAuthenticatedUser();
  const daily = await getDailyFixturesForUser(me.id);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Prono du jour</p>
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
                savedPrediction={fixture.savedPrediction}
              />
            ))}
            {fixtures.length === 0 && <p className="text-sm text-zinc-300">Aucun match disponible.</p>}
          </div>
        </section>
      ))}
      <PlayerNav />
    </main>
  );
}
