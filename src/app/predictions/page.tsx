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
  state: 'open' | 'saved' | 'locked';
  savedPrediction: { homeScore: number; awayScore: number } | null;
};

const schema = z.object({ fixtureId: z.string(), homeScore: z.coerce.number().min(0).max(20), awayScore: z.coerce.number().min(0).max(20) });
type FormData = z.infer<typeof schema>;

const quickScores: Array<[number, number]> = [
  [1, 0],
  [2, 1],
  [1, 1],
  [0, 0],
];

export default function PredictionsPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [savingFixtureId, setSavingFixtureId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fixtureId: '', homeScore: 0, awayScore: 0 },
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

  const openCount = useMemo(() => fixtures.filter((f) => f.state === 'open').length, [fixtures]);
  const savedCount = useMemo(() => fixtures.filter((f) => f.savedPrediction).length, [fixtures]);

  const onSubmit = async (data: FormData) => {
    setSavingFixtureId(data.fixtureId);
    const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      setMessage('Prediction saved. You are locked in for this match.');
      setFixtures((current) => current.map((fixture) => fixture.id === data.fixtureId
        ? { ...fixture, state: 'saved', savedPrediction: { homeScore: data.homeScore, awayScore: data.awayScore } }
        : fixture));
      reset({ fixtureId: '', homeScore: 0, awayScore: 0 });
      await refreshFixtures();
    } else {
      const body = await res.json();
      setMessage(body.error ?? 'Could not save prediction');
    }
    setSavingFixtureId('');
  };

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 pb-24 pt-5">
      <header className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wide text-emerald-100">Matchday Hub</p>
        <h1 className="mt-1 text-2xl font-bold">Make your predictions</h1>
        <p className="mt-2 text-sm text-emerald-50">Predict before kickoff, earn points, and rise up the rankings.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/15 p-2"><p className="text-lg font-bold">{fixtures.length}</p><p>Matches</p></div>
          <div className="rounded-xl bg-white/15 p-2"><p className="text-lg font-bold">{savedCount}</p><p>Saved</p></div>
          <div className="rounded-xl bg-white/15 p-2"><p className="text-lg font-bold">{openCount}</p><p>Open</p></div>
        </div>
      </header>

      <div className="card border-amber-200 bg-amber-50">
        <p className="text-sm font-semibold text-amber-900">Motivation</p>
        <p className="mt-1 text-sm text-amber-800">{openCount > 0 ? `${openCount} matches still open today — 1 more prediction could complete your challenge.` : 'All available matches are already predicted or locked. Great consistency.'}</p>
      </div>

      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>}
      {errors.fixtureId && <p className="text-sm text-rose-600">Please use &quot;Predict this match&quot; before saving.</p>}

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        {loading && <div className="card text-sm text-slate-500">Loading fixtures…</div>}

        {!loading && fixtures.length === 0 && (
          <div className="card text-center">
            <p className="font-semibold">No fixtures available right now</p>
            <p className="mt-1 text-sm text-slate-600">Check again after sync or once new matchdays are published.</p>
          </div>
        )}

        {!loading && fixtures.map((f) => {
          const isSelected = selectedFixtureId === f.id;
          const isLocked = f.state === 'locked';
          const saved = f.savedPrediction;

          return (
            <article className="card space-y-3" key={f.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{f.competition}</p>
                  <p className="mt-1 font-semibold">{f.home} vs {f.away}</p>
                  <p className="text-xs text-slate-500">Kickoff: {new Date(f.kickoff).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLocked ? 'bg-slate-200 text-slate-700' : f.state === 'saved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {isLocked ? 'Locked' : f.state === 'saved' ? 'Saved' : 'Open'}
                </span>
              </div>

              {saved && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Saved score: <strong>{f.home} {saved.homeScore} - {saved.awayScore} {f.away}</strong>
                </div>
              )}

              {!isLocked && (
                <div className="space-y-2">
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${isSelected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
                    type="button"
                    onClick={() => {
                      setValue('fixtureId', f.id);
                      setValue('homeScore', saved?.homeScore ?? 1);
                      setValue('awayScore', saved?.awayScore ?? 0);
                    }}
                  >
                    {saved ? 'Update this prediction' : 'Predict this match'}
                  </button>

                  {isSelected && (
                    <>
                      <div className="flex items-center gap-2">
                        <input type="hidden" value={f.id} {...register('fixtureId')} />
                        <input className="w-16 rounded-lg border border-slate-300 p-2" type="number" min={0} max={20} placeholder="H" {...register('homeScore')} />
                        <input className="w-16 rounded-lg border border-slate-300 p-2" type="number" min={0} max={20} placeholder="A" {...register('awayScore')} />
                        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" disabled={savingFixtureId === f.id} type="submit">
                          {savingFixtureId === f.id ? 'Saving...' : saved ? 'Update' : 'Save'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickScores.map(([h, a]) => (
                          <button
                            key={`${h}-${a}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                            onClick={() => {
                              setValue('homeScore', h);
                              setValue('awayScore', a);
                            }}
                            type="button"
                          >
                            Quick pick {h}-{a}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </form>
      <PlayerNav />
    </main>
  );
}
