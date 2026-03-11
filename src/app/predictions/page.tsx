'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PlayerNav } from '@/components/player-nav';

type Fixture = { id: string; home: string; away: string; kickoff: string; state: string };

const schema = z.object({ fixtureId: z.string(), homeScore: z.coerce.number().min(0).max(20), awayScore: z.coerce.number().min(0).max(20) });
type FormData = z.infer<typeof schema>;

export default function PredictionsPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [message, setMessage] = useState('');
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch('/api/public/fixtures').then((r) => r.json()).then((d) => setFixtures(d.fixtures || []));
  }, []);

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setMessage(res.ok ? 'Prediction saved!' : 'Could not save prediction');
    reset();
  };

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <h1 className="mb-2 text-xl font-bold">Predictions</h1>
      <p className="mb-3 text-sm text-slate-600">Only open fixtures are shown. Predictions lock at kickoff.</p>
      <div className="card mb-3">Sponsored card placement</div>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        {fixtures.map((f) => (
          <div className="card" key={f.id}>
            <p className="font-semibold">{f.home} vs {f.away}</p>
            <p className="text-xs text-slate-500">{new Date(f.kickoff).toLocaleString()} ({f.state})</p>
            <input type="hidden" value={f.id} {...register('fixtureId')} />
            <div className="mt-2 flex gap-2">
              <input className="w-16 rounded border p-2" type="number" placeholder="H" {...register('homeScore')} />
              <input className="w-16 rounded border p-2" type="number" placeholder="A" {...register('awayScore')} />
              <button className="rounded bg-brand px-3 text-white" type="submit">Save</button>
            </div>
          </div>
        ))}
      </form>
      {message && <p className="mt-2 text-sm">{message}</p>}
      <PlayerNav />
    </main>
  );
}
