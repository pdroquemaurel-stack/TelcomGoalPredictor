'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PlayerNav } from '@/components/player-nav';
import { WorldCup2026Poc } from '@/components/world-cup-2026-poc';

type Fixture = {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  competition: string;
  state: 'open' | 'saved' | 'locked' | 'resolved';
  savedPrediction: { homeScore: number; awayScore: number } | null;
  finalScore: { homeScore: number; awayScore: number } | null;
  resultStatus: 'won' | 'lost' | 'pending' | null;
};

type Tab = 'upcoming' | 'past';
type Mode = 'classic' | 'worldcup';

const schema = z.object({ fixtureId: z.string(), homeScore: z.coerce.number().min(0).max(20), awayScore: z.coerce.number().min(0).max(20) });
type FormData = z.infer<typeof schema>;

const quickScores: Array<[number, number]> = [[1, 0], [2, 1], [1, 1], [0, 0], [0, 1]];

function getStatus(f: Fixture) {
  if (f.state === 'resolved') return { label: 'resolved', tone: 'bg-white text-black' };
  if (f.resultStatus === 'pending') return { label: 'pending result', tone: 'bg-yellow-300 text-black' };
  if (f.state === 'locked') return { label: 'locked', tone: 'bg-zinc-500 text-white' };
  if (f.state === 'saved') return { label: 'predicted', tone: 'bg-brand text-black' };
  return { label: 'not predicted', tone: 'bg-rose-500 text-white' };
}

export default function PredictionsPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [savingFixtureId, setSavingFixtureId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [mode, setMode] = useState<Mode>('classic');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fixtureId: '', homeScore: 1, awayScore: 0 },
  });

  const selectedFixtureId = watch('fixtureId');

  const refreshFixtures = async () => {
    setLoading(true);
    const res = await fetch('/api/public/fixtures', { cache: 'no-store' });
    const d = await res.json();
    setFixtures(d.fixtures || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshFixtures();
  }, []);

  const upcomingFixtures = useMemo(() => {
    const nowMs = Date.now();
    return fixtures
      .filter((f) => +new Date(f.kickoff) >= nowMs)
      .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  }, [fixtures]);
  const pastFixtures = useMemo(() => {
    const nowMs = Date.now();
    return fixtures
      .filter((f) => +new Date(f.kickoff) < nowMs)
      .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff));
  }, [fixtures]);

  const visibleFixtures = tab === 'upcoming' ? upcomingFixtures : pastFixtures;
  const todoCount = useMemo(() => upcomingFixtures.filter((f) => !f.savedPrediction).length, [upcomingFixtures]);

  const onSubmit = async (data: FormData) => {
    setSavingFixtureId(data.fixtureId);
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('✅ Prono sauvegardé. Tu peux le modifier tant que le match n’a pas commencé.');
      setFixtures((current) => current.map((f) => f.id === data.fixtureId
        ? { ...f, state: 'saved', savedPrediction: { homeScore: data.homeScore, awayScore: data.awayScore }, resultStatus: 'pending' }
        : f));
      reset({ fixtureId: '', homeScore: 1, awayScore: 0 });
      await refreshFixtures();
    } else {
      const body = await res.json();
      setMessage(`❌ ${body.error ?? 'Impossible de sauvegarder le prono.'}`);
    }
    setSavingFixtureId('');
  };

  const renderCard = (f: Fixture) => {
    const isSelected = selectedFixtureId === f.id;
    const canEdit = f.state === 'open' || f.state === 'saved';
    const status = getStatus(f);

    return (
      <article className="rounded-3xl border-2 border-white/15 bg-gradient-to-br from-zinc-900 to-black p-5 shadow-xl" key={f.id}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">{f.competition}</p>
            <h3 className="mt-1 text-2xl font-black leading-tight">{f.home} <span className="text-zinc-400">vs</span> {f.away}</h3>
            <p className="mt-1 text-xs font-semibold text-zinc-300">{new Date(f.kickoff).toLocaleString()}</p>
          </div>
          <span className={`game-chip ${status.tone}`}>{status.label.toUpperCase()}</span>
        </div>

        {f.savedPrediction && (
          <div className="mt-4 rounded-2xl border border-brand bg-brand/15 p-3 text-sm">
            <p className="font-bold text-orange-200">Ton prono</p>
            <p className="text-lg font-black">{f.home} {f.savedPrediction.homeScore} - {f.savedPrediction.awayScore} {f.away}</p>
          </div>
        )}

        {f.finalScore && (
          <div className="mt-3 rounded-2xl border border-white/20 bg-black p-3 text-sm">
            <p className="font-bold text-zinc-300">Score final</p>
            <p className="text-lg font-black">{f.home} {f.finalScore.homeScore} - {f.finalScore.awayScore} {f.away}</p>
          </div>
        )}

        {!f.savedPrediction && tab === 'upcoming' && (
          <p className="mt-3 rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-bold text-rose-200">⚠️ Aucun prono enregistré pour ce match.</p>
        )}

        {canEdit && (
          <div className="mt-4 space-y-3">
            <button
              className={`w-full rounded-2xl px-4 py-4 text-base font-black ${isSelected ? 'bg-brand text-black' : 'bg-white text-black'}`}
              type="button"
              onClick={() => {
                setValue('fixtureId', f.id);
                setValue('homeScore', f.savedPrediction?.homeScore ?? 1);
                setValue('awayScore', f.savedPrediction?.awayScore ?? 0);
              }}
            >
              {f.savedPrediction ? 'Éditer mon prono' : 'Pronostiquer maintenant'}
            </button>

            {isSelected && (
              <>
                <input type="hidden" value={f.id} {...register('fixtureId')} />
                <div className="flex items-center justify-between gap-3">
                  <input className="h-16 w-full rounded-2xl border-2 border-white/20 bg-black px-4 text-center text-3xl font-black" type="number" min={0} max={20} {...register('homeScore')} />
                  <span className="text-3xl font-black text-orange-300">-</span>
                  <input className="h-16 w-full rounded-2xl border-2 border-white/20 bg-black px-4 text-center text-3xl font-black" type="number" min={0} max={20} {...register('awayScore')} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickScores.map(([h, a]) => (
                    <button key={`${h}-${a}`} className="rounded-full border border-white/20 bg-zinc-900 px-3 py-2 text-xs font-bold" type="button" onClick={() => {
                      setValue('homeScore', h);
                      setValue('awayScore', a);
                    }}>
                      {h}-{a}
                    </button>
                  ))}
                </div>
                <button className="cta-primary w-full py-4 text-base" disabled={savingFixtureId === f.id} type="submit">
                  {savingFixtureId === f.id ? 'Sauvegarde...' : f.savedPrediction ? 'Mettre à jour' : 'Sauvegarder'}
                </button>
              </>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black shadow-xl shadow-orange-500/40">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Prono Arena</p>
        <h1 className="mt-2 text-3xl font-black">Main player screen</h1>
        <p className="mt-2 text-sm font-semibold">{todoCount > 0 ? `${todoCount} match(s) à pronostiquer.` : 'Tous les matchs à venir sont couverts.'}</p>
      </header>

      <section className="grid grid-cols-2 gap-2 rounded-3xl bg-zinc-900 p-2">
        {[['classic', 'Mode Classique'], ['worldcup', 'World Cup 2026']].map(([value, label]) => (
          <button
            className={`rounded-2xl px-3 py-3 text-sm font-black ${mode === value ? 'bg-brand text-black' : 'bg-black text-white border border-white/10'}`}
            key={value}
            onClick={() => setMode(value as Mode)}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>

      {mode === 'worldcup' ? <WorldCup2026Poc /> : (
        <>
          <section className="grid grid-cols-2 gap-2 rounded-3xl bg-zinc-900 p-2">
            {[['upcoming', 'Matchs à venir'], ['past', 'Matchs passés']].map(([value, label]) => (
              <button
                className={`rounded-2xl px-3 py-3 text-sm font-black ${tab === value ? 'bg-brand text-black' : 'bg-black text-white border border-white/10'}`}
                key={value}
                onClick={() => setTab(value as Tab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </section>

          {message && <p className="rounded-2xl border border-brand bg-brand/10 px-4 py-3 text-sm font-semibold text-orange-100">{message}</p>}
          {errors.fixtureId && <p className="text-sm font-bold text-rose-300">Choisis d’abord un match avec le bouton principal.</p>}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {loading && <div className="card text-sm text-zinc-300">Chargement des matchs...</div>}

            {!loading && visibleFixtures.length > 0 && (
              <section className="space-y-3">{visibleFixtures.map(renderCard)}</section>
            )}

            {!loading && visibleFixtures.length === 0 && (
              <div className="card text-center">
                <p className="text-lg font-black">Aucun match {tab === 'upcoming' ? 'à venir' : 'passé'} disponible</p>
              </div>
            )}
          </form>
        </>
      )}

      <PlayerNav />
    </main>
  );
}
