'use client';

import { useState } from 'react';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';

type UpcomingFixture = {
  id: string;
  kickoff: string | Date;
  competition: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  savedPrediction: { homeScore: number; awayScore: number } | null;
  odds: { homeWin: string; draw: string; awayWin: string };
};

type PastFixture = {
  id: string;
  kickoff: string | Date;
  competition: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  finalScore: { homeScore: number; awayScore: number } | null;
  savedPrediction: { homeScore: number; awayScore: number };
  points: number;
};

type DailyViewProps = {
  upcomingGroups: Array<{ label: string; fixtures: UpcomingFixture[] }>;
  pastGroups: Array<{ label: string; fixtures: PastFixture[]; totalPoints: number }>;
};

export function DailyView({ upcomingGroups, pastGroups }: DailyViewProps) {
  const [showPast, setShowPast] = useState(false);

  return (
    <>
      <section className="card border-brand bg-brand/10">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-1 text-xs font-black">
          <button
            className={`rounded-lg px-2 py-2 ${!showPast ? 'bg-brand text-black' : 'text-zinc-300'}`}
            onClick={() => setShowPast(false)}
            type="button"
          >
            À venir
          </button>
          <button
            className={`rounded-lg px-2 py-2 ${showPast ? 'bg-brand text-black' : 'text-zinc-300'}`}
            onClick={() => setShowPast(true)}
            type="button"
          >
            Passés
          </button>
        </div>
      </section>

      {!showPast &&
        upcomingGroups.map((group) => (
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

      {!showPast && upcomingGroups.length === 0 && (
        <section className="card">
          <p className="text-sm text-zinc-300">Aucun match à venir disponible.</p>
        </section>
      )}

      {showPast &&
        pastGroups.map((group) => (
          <section key={group.label} className="card">
            <h2 className="section-title">{group.label}</h2>
            <div className="mt-3 space-y-2">
              {group.fixtures.map((fixture) => (
                <FixturePredictionCard
                  key={fixture.id}
                  away={fixture.away}
                  awayLogoUrl={fixture.awayLogoUrl}
                  competition={fixture.competition}
                  editable={false}
                  fixtureId={fixture.id}
                  finalScore={fixture.finalScore}
                  home={fixture.home}
                  homeLogoUrl={fixture.homeLogoUrl}
                  kickoff={fixture.kickoff}
                  points={fixture.points}
                  savedPrediction={fixture.savedPrediction}
                />
              ))}
            </div>
            <p className="mt-3 text-right text-sm font-black text-brand">Total du jour: +{group.totalPoints} pts</p>
          </section>
        ))}

      {showPast && pastGroups.length === 0 && (
        <section className="card">
          <p className="text-sm text-zinc-300">Aucun match passé pronostiqué pour le moment.</p>
        </section>
      )}
    </>
  );
}
