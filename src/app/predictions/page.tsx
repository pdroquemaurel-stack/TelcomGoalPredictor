'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PlayerNav } from '@/components/player-nav';

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

const schema = z.object({ fixtureId: z.string(), homeScore: z.coerce.number().min(0).max(20), awayScore: z.coerce.number().min(0).max(20) });
type FormData = z.infer<typeof schema>;

const quickScores: Array<[number, number]> = [[1, 0], [2, 1], [1, 1], [0, 0], [0, 1]];

function chipStyle(state: Fixture['state']) {
  if (state === 'open') return 'bg-emerald-400 text-black';
  if (state === 'saved') return 'bg-brand text-black';
  if (state === 'locked') return 'bg-zinc-500 text-white';
  return 'bg-white text-black';
}

function resultChip(status: Fixture['resultStatus']) {
  if (status === 'won') return <span className="game-chip bg-emerald-400 text-black">WON</span>;
  if (status === 'lost') return <span className="game-chip bg-rose-500 text-white">LOST</span>;
  if (status === 'pending') return <span className="game-chip bg-yellow-300 text-black">PENDING</span>;
  return null;
}

export default function PredictionsPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [savingFixtureId, setSavingFixtureId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

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

  const openFixtures = useMemo(() => fixtures.filter((f) => f.state === 'open' || f.state === 'saved'), [fixtures]);
  const waitingFixtures = useMemo(() => fixtures.filter((f) => f.resultStatus === 'pending' && f.state !== 'resolved'), [fixtures]);
  const resolvedFixtures = useMemo(() => fixtures.filter((f) => f.state === 'resolved'), [fixtures]);
  const todoCount = useMemo(() => fixtures.filter((f) => f.state === 'open' && !f.savedPrediction).length, [fixtures]);

  const onSubmit = async (data: FormData) => {
    setSavingFixtureId(data.fixtureId);
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('✅ Prono sauvegardé ! Tu marques des points si le match tourne en ta faveur.');
      setFixtures((current) => current.map((f) => f.id === data.fixtureId ? { ...f, state: 'saved', savedPrediction: { homeScore: data.homeScore, awayScore: data.awayScore }, resultStatus: 'pending' } : f));
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

    return (
      <article className="card space-y-4" key={f.id}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-300">{f.competition}</p>
            <h3 className="mt-1 text-xl font-black leading-tight">{f.home} <span className="text-zinc-400">vs</span> {f.away}</h3>
            <p className="mt-1 text-xs text-zinc-300">Kickoff: {new Date(f.kickoff).toLocaleString()}</p>
          </div>
          <span className={`game-chip ${chipStyle(f.state)}`}>{f.state.toUpperCase()}</span>
        </div>

        {f.savedPrediction && (
          <div className="rounded-2xl border border-brand bg-brand/15 p-3 text-sm">
            <p className="font-bold text-orange-200">Ton prono</p>
            <p className="text-lg font-black">{f.home} {f.savedPrediction.homeScore} - {f.savedPrediction.awayScore} {f.away}</p>
          </div>
        )}

        {f.finalScore && (
          <div className="rounded-2xl border border-white/20 bg-black p-3 text-sm">
            <p className="font-bold text-zinc-300">Score final</p>
            <p className="text-lg font-black">{f.home} {f.finalScore.homeScore} - {f.finalScore.awayScore} {f.away}</p>
          </div>
        )}

        <div className="flex items-center gap-2">{resultChip(f.resultStatus)}</div>

        {canEdit && (
          <div className="space-y-3">
            <button
              className={`w-full rounded-2xl px-4 py-3 text-sm font-black ${isSelected ? 'bg-brand text-black' : 'bg-white text-black'}`}
              type="button"
              onClick={() => {
                setValue('fixtureId', f.id);
                setValue('homeScore', f.savedPrediction?.homeScore ?? 1);
                setValue('awayScore', f.savedPrediction?.awayScore ?? 0);
              }}
            >
              {f.savedPrediction ? 'Modifier mon prono' : 'Pronostiquer ce match'}
            </button>

            {isSelected && (
              <>
                <input type="hidden" value={f.id} {...register('fixtureId')} />
                <div className="flex items-center justify-between gap-3">
                  <input className="h-14 w-full rounded-2xl border-2 border-white/20 bg-black px-4 text-center text-2xl font-black" type="number" min={0} max={20} {...register('homeScore')} />
                  <span className="text-2xl font-black text-orange-300">-</span>
                  <input className="h-14 w-full rounded-2xl border-2 border-white/20 bg-black px-4 text-center text-2xl font-black" type="number" min={0} max={20} {...register('awayScore')} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickScores.map(([h, a]) => (
                    <button key={`${h}-${a}`} className="rounded-full border border-white/20 bg-zinc-900 px-3 py-1 text-xs font-bold" type="button" onClick={() => {
                      setValue('homeScore', h);
                      setValue('awayScore', a);
                    }}>
                      {h}-{a}
                    </button>
                  ))}
                </div>
                <button className="cta-primary w-full" disabled={savingFixtureId === f.id} type="submit">
                  {savingFixtureId === f.id ? 'Sauvegarde...' : f.savedPrediction ? 'Mettre à jour le prono' : 'Sauvegarder le prono'}
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
      <header className="rounded-3xl bg-brand p-5 text-black shadow-xl shadow-orange-500/30">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Prono Arena</p>
        <h1 className="mt-2 text-3xl font-black">Tes pronos du jour</h1>
        <p className="mt-2 text-sm font-semibold">{todoCount > 0 ? `${todoCount} match(s) à pronostiquer maintenant.` : 'Tout est joué pour l’instant. Bien joué !'}</p>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="card p-3"><p className="text-2xl font-black text-brand">{openFixtures.length}</p><p>OPEN/SAVED</p></div>
        <div className="card p-3"><p className="text-2xl font-black text-yellow-300">{waitingFixtures.length}</p><p>PENDING</p></div>
        <div className="card p-3"><p className="text-2xl font-black text-white">{resolvedFixtures.length}</p><p>RESOLVED</p></div>
      </section>

      {message && <p className="rounded-2xl border border-brand bg-brand/10 px-4 py-3 text-sm font-semibold text-orange-100">{message}</p>}
      {errors.fixtureId && <p className="text-sm font-bold text-rose-300">Choisis d’abord un match avec le bouton principal.</p>}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {loading && <div className="card text-sm text-zinc-300">Chargement des matchs...</div>}

        {!loading && openFixtures.length > 0 && (
          <section className="space-y-3">
            <h2 className="section-title">À jouer maintenant</h2>
            {openFixtures.map(renderCard)}
          </section>
        )}

        {!loading && waitingFixtures.length > 0 && (
          <section className="space-y-3">
            <h2 className="section-title">En attente de résultat</h2>
            {waitingFixtures.map(renderCard)}
          </section>
        )}

        {!loading && resolvedFixtures.length > 0 && (
          <section className="space-y-3">
            <h2 className="section-title">Résultats terminés</h2>
            {resolvedFixtures.map(renderCard)}
          </section>
        )}

        {!loading && fixtures.length === 0 && (
          <div className="card text-center">
            <p className="text-lg font-black">Aucun match disponible</p>
            <p className="mt-2 text-sm text-zinc-300">Reviens après la prochaine synchronisation des fixtures.</p>
          </div>
        )}
      </form>
      <PlayerNav />
    </main>
  );
}
