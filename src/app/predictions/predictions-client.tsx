'use client';

import { useEffect, useMemo, useState } from 'react';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';
import { PlayerNav } from '@/components/player-nav';
import { groupFixturesByDay } from '@/lib/fixture-grouping';
import { isPastFixture, isUpcomingFixture } from '@/lib/predictions-fixture-filters';

type Fixture = {
  id: string;
  competitionId: string;
  fixtureState: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'SETTLED';
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  kickoff: string;
  lifecycleStatus: 'upcoming' | 'live' | 'locked' | 'resolved';
  competition: string;
  state: 'open' | 'saved' | 'locked' | 'resolved';
  points: number;
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore: { homeScore: number; awayScore: number } | null;
  odds: { homeWin: number; draw: number; awayWin: number };
};

type Tab = 'upcoming' | 'past';

export function PredictionsClient() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => {
    const refreshFixtures = async () => {
      setLoading(true);
      const res = await fetch('/api/public/fixtures', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data?.error?.message ?? 'Erreur de chargement des matchs.'}`);
        setLoading(false);
        return;
      }

      setFixtures(data.fixtures || []);
      setLoading(false);
    };

    refreshFixtures();
  }, []);

  const upcomingFixtures = useMemo(
    () => fixtures
      .filter((fixture) => isUpcomingFixture(fixture))
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff)),
    [fixtures],
  );

  const pastFixtures = useMemo(
    () => fixtures
      .filter((fixture) => isPastFixture(fixture))
      .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff)),
    [fixtures],
  );

  const groupedFixtures = groupFixturesByDay(tab === 'upcoming' ? upcomingFixtures : pastFixtures);
  const availablePredictionsCount = upcomingFixtures.length;
  const savedUpcomingPredictionsCount = upcomingFixtures.filter((fixture) => Boolean(fixture.savedPrediction)).length;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Pronos</p>
        <h1 className="mt-1 text-2xl font-black">Tous les matchs visibles</h1>
        <p className="mt-1 text-sm font-bold">{savedUpcomingPredictionsCount} pronostic(s) enregistré(s) / {availablePredictionsCount}</p>
      </header>

      <section className="card border-brand bg-brand/10 text-sm">
        <p className="font-black">Barème: 3 pts score exact • 1 pt bon résultat • 0 pt sinon.</p>
      </section>

      <section className="grid grid-cols-2 gap-2 rounded-3xl bg-zinc-900 p-2">
        {[['upcoming', 'Matchs à venir'], ['past', 'Matchs passés']].map(([value, label]) => (
          <button className={`rounded-2xl px-3 py-3 text-sm font-black ${tab === value ? 'bg-brand text-black' : 'border border-white/10 bg-black text-white'}`} key={value} onClick={() => setTab(value as Tab)} type="button">{label}</button>
        ))}
      </section>


      {message && <p className="rounded-2xl border border-brand bg-brand/10 px-4 py-3 text-sm font-semibold text-orange-100">{message}</p>}
      {loading && <section className="card text-sm text-zinc-300">Chargement des matchs...</section>}

      {!loading && groupedFixtures.length === 0 && (
        <section className="card text-sm text-zinc-300">
          {tab === 'upcoming'
            ? 'Aucun match à pronostiquer pour le moment.'
            : 'Aucun pronostic passé pour le moment.'}
        </section>
      )}

      {groupedFixtures.map((group) => (
        <section className="card" key={group.key}>
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-orange-300">{group.label}</h2>
          <div className="mt-2">
            {group.fixtures.map((fixture) => {
              const editable = fixture.state === 'open' || fixture.state === 'saved';
              return (
                <FixturePredictionCard
                  key={fixture.id}
                  away={fixture.away}
                  awayLogoUrl={fixture.awayLogoUrl}
                  competition={fixture.competition}
                  editable={editable}
                  finalScore={fixture.finalScore}
                  fixtureId={fixture.id}
                  home={fixture.home}
                  homeLogoUrl={fixture.homeLogoUrl}
                  kickoff={fixture.kickoff}
                  points={fixture.points}
                  savedPrediction={fixture.savedPrediction}
                  odds={fixture.odds}
                  isLocked={tab === 'upcoming' && fixture.state === 'locked'}
                />
              );
            })}
          </div>
        </section>
      ))}

      <PlayerNav />
    </main>
  );
}
