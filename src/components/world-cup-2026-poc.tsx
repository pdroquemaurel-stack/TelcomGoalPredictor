'use client';

import { useMemo, useState } from 'react';

type GroupFixture = {
  id: string;
  group: string;
  home: string;
  away: string;
};

type PredictedScore = { home: number; away: number };

type TeamStanding = {
  team: string;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

const groups = {
  A: ['Morocco', 'Mexico', 'Japan', 'Nigeria'],
  B: ['Senegal', 'USA', 'Croatia', 'Korea'],
  C: ['Côte d’Ivoire', 'Brazil', 'Serbia', 'Canada'],
  D: ['Ghana', 'France', 'Uruguay', 'Australia'],
} as const;

const groupFixtures: GroupFixture[] = [
  { id: 'A1', group: 'A', home: 'Morocco', away: 'Mexico' },
  { id: 'A2', group: 'A', home: 'Japan', away: 'Nigeria' },
  { id: 'A3', group: 'A', home: 'Morocco', away: 'Japan' },
  { id: 'A4', group: 'A', home: 'Mexico', away: 'Nigeria' },
  { id: 'A5', group: 'A', home: 'Morocco', away: 'Nigeria' },
  { id: 'A6', group: 'A', home: 'Mexico', away: 'Japan' },
  { id: 'B1', group: 'B', home: 'Senegal', away: 'USA' },
  { id: 'B2', group: 'B', home: 'Croatia', away: 'Korea' },
  { id: 'B3', group: 'B', home: 'Senegal', away: 'Croatia' },
  { id: 'B4', group: 'B', home: 'USA', away: 'Korea' },
  { id: 'B5', group: 'B', home: 'Senegal', away: 'Korea' },
  { id: 'B6', group: 'B', home: 'USA', away: 'Croatia' },
  { id: 'C1', group: 'C', home: 'Côte d’Ivoire', away: 'Brazil' },
  { id: 'C2', group: 'C', home: 'Serbia', away: 'Canada' },
  { id: 'C3', group: 'C', home: 'Côte d’Ivoire', away: 'Serbia' },
  { id: 'C4', group: 'C', home: 'Brazil', away: 'Canada' },
  { id: 'C5', group: 'C', home: 'Côte d’Ivoire', away: 'Canada' },
  { id: 'C6', group: 'C', home: 'Brazil', away: 'Serbia' },
  { id: 'D1', group: 'D', home: 'Ghana', away: 'France' },
  { id: 'D2', group: 'D', home: 'Uruguay', away: 'Australia' },
  { id: 'D3', group: 'D', home: 'Ghana', away: 'Uruguay' },
  { id: 'D4', group: 'D', home: 'France', away: 'Australia' },
  { id: 'D5', group: 'D', home: 'Ghana', away: 'Australia' },
  { id: 'D6', group: 'D', home: 'France', away: 'Uruguay' },
];

function emptyStanding(team: string): TeamStanding {
  return { team, pts: 0, gf: 0, ga: 0, gd: 0 };
}

function resolveStandings(group: keyof typeof groups, predictions: Record<string, PredictedScore>) {
  const table = new Map<string, TeamStanding>(groups[group].map((team) => [team, emptyStanding(team)]));

  groupFixtures
    .filter((f) => f.group === group)
    .forEach((fixture) => {
      const result = predictions[fixture.id];
      if (!result) return;

      const home = table.get(fixture.home);
      const away = table.get(fixture.away);
      if (!home || !away) return;

      home.gf += result.home;
      home.ga += result.away;
      away.gf += result.away;
      away.ga += result.home;
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (result.home > result.away) home.pts += 3;
      else if (result.home < result.away) away.pts += 3;
      else {
        home.pts += 1;
        away.pts += 1;
      }
    });

  return Array.from(table.values()).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
}

export function WorldCup2026Poc() {
  const [predictions, setPredictions] = useState<Record<string, PredictedScore>>({});

  const standings = useMemo(() => ({
    A: resolveStandings('A', predictions),
    B: resolveStandings('B', predictions),
    C: resolveStandings('C', predictions),
    D: resolveStandings('D', predictions),
  }), [predictions]);

  const qualified = useMemo(() => ({
    A1: standings.A[0]?.team ?? 'A1',
    A2: standings.A[1]?.team ?? 'A2',
    B1: standings.B[0]?.team ?? 'B1',
    B2: standings.B[1]?.team ?? 'B2',
    C1: standings.C[0]?.team ?? 'C1',
    C2: standings.C[1]?.team ?? 'C2',
    D1: standings.D[0]?.team ?? 'D1',
    D2: standings.D[1]?.team ?? 'D2',
  }), [standings]);

  return (
    <section className="space-y-4">
      <header className="rounded-3xl border-2 border-brand bg-gradient-to-br from-orange-500 to-orange-300 p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em]">POC mode</p>
        <h2 className="mt-1 text-2xl font-black">World Cup 2026</h2>
        <p className="text-sm font-semibold">Pronostics de groupes + bracket prédictif en direct pour les démos produit.</p>
      </header>

      <section className="space-y-3">
        <h3 className="section-title">Group Stage Predictor</h3>
        {groupFixtures.map((fixture) => {
          const value = predictions[fixture.id];
          return (
            <article className="rounded-3xl border border-white/20 bg-zinc-900 p-4" key={fixture.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-brand">Groupe {fixture.group}</p>
                <span className="game-chip bg-white text-black">Demo Match</span>
              </div>
              <p className="mt-2 text-lg font-black">{fixture.home} <span className="text-zinc-400">vs</span> {fixture.away}</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="h-12 w-full rounded-2xl border-2 border-white/20 bg-black text-center text-xl font-black"
                  min={0}
                  max={20}
                  type="number"
                  value={value?.home ?? ''}
                  onChange={(e) => {
                    const nextHome = Number(e.target.value);
                    setPredictions((current) => ({ ...current, [fixture.id]: { home: nextHome, away: current[fixture.id]?.away ?? 0 } }));
                  }}
                />
                <span className="text-xl font-black text-brand">-</span>
                <input
                  className="h-12 w-full rounded-2xl border-2 border-white/20 bg-black text-center text-xl font-black"
                  min={0}
                  max={20}
                  type="number"
                  value={value?.away ?? ''}
                  onChange={(e) => {
                    const nextAway = Number(e.target.value);
                    setPredictions((current) => ({ ...current, [fixture.id]: { home: current[fixture.id]?.home ?? 0, away: nextAway } }));
                  }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h3 className="section-title">Classements provisoires</h3>
        {(Object.keys(groups) as Array<keyof typeof groups>).map((group) => (
          <article className="card" key={group}>
            <p className="text-sm font-black text-brand">Groupe {group}</p>
            <div className="mt-2 space-y-2 text-sm">
              {standings[group].map((team, index) => (
                <div className={`flex items-center justify-between rounded-2xl p-2 ${index < 2 ? 'bg-brand text-black' : 'bg-zinc-900 text-white'}`} key={team.team}>
                  <span className="font-bold">{index + 1}. {team.team}</span>
                  <span className="font-black">{team.pts} pts</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="section-title">Knockout Bracket (prévisionnel)</h3>
        <div className="grid gap-3">
          <article className="card">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Quarts</p>
            <p className="mt-2 font-bold">QF1: {qualified.A1} vs {qualified.B2}</p>
            <p className="font-bold">QF2: {qualified.C1} vs {qualified.D2}</p>
            <p className="font-bold">QF3: {qualified.B1} vs {qualified.A2}</p>
            <p className="font-bold">QF4: {qualified.D1} vs {qualified.C2}</p>
          </article>
          <article className="card border-brand bg-brand/10">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-200">Demi/Finale (auto-mappées)</p>
            <p className="mt-2 font-bold">SF1: Vainqueur QF1 vs Vainqueur QF2</p>
            <p className="font-bold">SF2: Vainqueur QF3 vs Vainqueur QF4</p>
            <p className="mt-2 text-lg font-black text-brand">Finale: Vainqueur SF1 vs Vainqueur SF2</p>
          </article>
        </div>
      </section>
    </section>
  );
}
