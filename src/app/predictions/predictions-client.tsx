'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlayerNav } from '@/components/player-nav';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';
import { groupFixturesByDay } from '@/lib/fixture-grouping';

type Fixture = {
  id: string;
  competitionId: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  kickoff: string;
  competition: string;
  state: 'open' | 'saved' | 'locked' | 'resolved';
  points: number;
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore: { homeScore: number; awayScore: number } | null;
};

type Competition = {
  id: string;
  name: string;
  code: string | null;
  totalMatches: number;
  predictedMatches: number;
  remainingMatches: number;
};

type Tab = 'upcoming' | 'past';

export function PredictionsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeCompetitionId, setActiveCompetitionId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  const refreshFixtures = async (competitionId?: string | null) => {
    setLoading(true);
    const query = competitionId ? `?competitionId=${competitionId}` : '';
    const res = await fetch(`/api/public/fixtures${query}`, { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      setMessage(`❌ ${data?.error?.message ?? 'Erreur de chargement des matchs.'}`);
      setLoading(false);
      return;
    }

    setCompetitions(data.competitions || []);
    setActiveCompetitionId(data.activeCompetitionId || '');
    setFixtures(data.fixtures || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshFixtures(searchParams.get('competitionId'));
  }, [searchParams]);

  const upcomingFixtures = useMemo(
    () => fixtures
      .filter((fixture) => +new Date(fixture.kickoff) >= Date.now())
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff)),
    [fixtures],
  );

  const pastFixtures = useMemo(
    () => fixtures
      .filter((fixture) => +new Date(fixture.kickoff) < Date.now() && fixture.savedPrediction)
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff)),
    [fixtures],
  );

  const activeCompetition = competitions.find((competition) => competition.id === activeCompetitionId);
  const groupedFixtures = groupFixturesByDay(tab === 'upcoming' ? upcomingFixtures : pastFixtures);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Pronos</p>
        <h1 className="mt-1 text-2xl font-black">{activeCompetition?.name ?? 'Compétition'}</h1>
        <p className="mt-1 text-sm font-bold">{activeCompetition?.predictedMatches ?? 0} / {activeCompetition?.totalMatches ?? 0} matchs pronostiqués</p>
      </header>

      <section className="card border-brand bg-brand/10 text-sm">
        <p className="font-black">Barème: 3 pts score exact • 1 pt bon résultat • 0 pt sinon.</p>
      </section>

      <section className="card">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300">Compétition</p>
        <select className="w-full rounded-2xl border border-white/20 bg-black px-3 py-3 text-sm font-bold" value={activeCompetitionId} onChange={(e) => router.push(`/predictions?competitionId=${e.target.value}`)}>
          {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
        </select>
      </section>

      <section className="grid grid-cols-2 gap-2 rounded-3xl bg-zinc-900 p-2">
        {[['upcoming', 'À venir'], ['past', 'Passés']].map(([value, label]) => (
          <button className={`rounded-2xl px-3 py-3 text-sm font-black ${tab === value ? 'bg-brand text-black' : 'border border-white/10 bg-black text-white'}`} key={value} onClick={() => setTab(value as Tab)} type="button">{label}</button>
        ))}
      </section>

      {message && <p className="rounded-2xl border border-brand bg-brand/10 px-4 py-3 text-sm font-semibold text-orange-100">{message}</p>}
      {loading && <section className="card text-sm text-zinc-300">Chargement des matchs...</section>}

      {!loading && groupedFixtures.length === 0 && (
        <section className="card text-sm text-zinc-300">
          {tab === 'upcoming'
            ? 'Aucun match à pronostiquer dans cette compétition pour le moment.'
            : 'Aucun pronostic passé dans cette compétition.'}
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
