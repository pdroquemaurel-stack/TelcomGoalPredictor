'use client';

import { useMemo, useState } from 'react';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';
import { groupFixturesByDay } from '@/lib/fixture-grouping';
import { isPastFixture, isUpcomingFixture } from '@/lib/predictions-fixture-filters';

type ChallengeFixture = {
  id: string;
  fixtureState: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'SETTLED';
  predictionEnabled: boolean;
  home: string;
  away: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  kickoff: string;
  competition: string;
  points: number;
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore: { homeScore: number; awayScore: number } | null;
};

type Tab = 'upcoming' | 'past';

export function ChallengeFixturesClient({ fixtures }: { fixtures: ChallengeFixture[] }) {
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcomingFixtures = useMemo(
    () => fixtures
      .filter((fixture) => isUpcomingFixture({ ...fixture, lifecycleStatus: undefined }))
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff)),
    [fixtures],
  );

  const pastFixtures = useMemo(
    () => fixtures
      .filter((fixture) => isPastFixture({ ...fixture, lifecycleStatus: fixture.finalScore ? 'resolved' : undefined }))
      .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff)),
    [fixtures],
  );

  const groupedFixtures = groupFixturesByDay(tab === 'upcoming' ? upcomingFixtures : pastFixtures);

  return (
    <section className="card">
      <h2 className="section-title">Matchs du challenge</h2>

      <section className="mt-3 grid grid-cols-2 gap-2 rounded-3xl bg-zinc-900 p-2">
        {[['upcoming', 'Matchs à venir'], ['past', 'Matchs passés']].map(([value, label]) => (
          <button className={`rounded-2xl px-3 py-3 text-sm font-black ${tab === value ? 'bg-brand text-black' : 'border border-white/10 bg-black text-white'}`} key={value} onClick={() => setTab(value as Tab)} type="button">{label}</button>
        ))}
      </section>

      {groupedFixtures.length === 0 && (
        <p className="mt-3 text-sm text-zinc-300">{tab === 'upcoming' ? 'Aucun match à venir dans ce challenge.' : 'Aucun match passé pronostiqué dans ce challenge.'}</p>
      )}

      {groupedFixtures.map((group) => (
        <div className="mt-3" key={group.key}>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-orange-300">{group.label}</h3>
          <div className="mt-2">
            {group.fixtures.map((fixture) => (
              <FixturePredictionCard
                key={fixture.id}
                away={fixture.away}
                awayLogoUrl={fixture.awayLogoUrl}
                competition={fixture.competition}
                editable={tab === 'upcoming' && fixture.predictionEnabled}
                finalScore={fixture.finalScore}
                fixtureId={fixture.id}
                home={fixture.home}
                homeLogoUrl={fixture.homeLogoUrl}
                kickoff={fixture.kickoff}
                points={fixture.points}
                savedPrediction={fixture.savedPrediction}
                isLocked={false}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
