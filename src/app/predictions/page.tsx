'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlayerNav } from '@/components/player-nav';

type Fixture = {
  id: string;
  competitionId: string;
  home: string;
  away: string;
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

const schema = z.object({ fixtureId: z.string(), homeScore: z.coerce.number().min(0).max(20), awayScore: z.coerce.number().min(0).max(20) });
type FormData = z.infer<typeof schema>;

function getStatus(state: Fixture['state']) {
  if (state === 'resolved') return { label: 'Result available', tone: 'bg-white text-black' };
  if (state === 'locked') return { label: 'Locked', tone: 'bg-zinc-500 text-white' };
  if (state === 'saved') return { label: 'Predicted', tone: 'bg-brand text-black' };
  return { label: 'Not predicted', tone: 'bg-rose-500 text-white' };
}

function PredictionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeCompetitionId, setActiveCompetitionId] = useState('');
  const [savingFixtureId, setSavingFixtureId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  const { handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fixtureId: '', homeScore: 1, awayScore: 0 },
  });

  const selectedFixtureId = watch('fixtureId');

  const refreshFixtures = async (competitionId?: string | null) => {
    setLoading(true);
    const query = competitionId ? `?competitionId=${competitionId}` : '';
    const res = await fetch(`/api/public/fixtures${query}`, { cache: 'no-store' });
    const d = await res.json();
    if (!res.ok) {
      setMessage(`❌ ${d?.error?.message ?? 'Erreur de chargement des matchs.'}`);
      setLoading(false);
      return;
    }
    setCompetitions(d.competitions || []);
    setActiveCompetitionId(d.activeCompetitionId || '');
    setFixtures(d.fixtures || []);
    setLoading(false);
  };

  useEffect(() => {
    refreshFixtures(searchParams.get('competitionId'));
  }, [searchParams]);

  const upcomingFixtures = useMemo(() => fixtures.filter((f) => +new Date(f.kickoff) >= Date.now()).sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff)), [fixtures]);
  const pastFixtures = useMemo(() => fixtures.filter((f) => +new Date(f.kickoff) < Date.now()).sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff)), [fixtures]);
  const visibleFixtures = tab === 'upcoming' ? upcomingFixtures : pastFixtures;
  const activeCompetition = competitions.find((competition) => competition.id === activeCompetitionId);

  const onSubmit = async (data: FormData) => {
    setSavingFixtureId(data.fixtureId);
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setMessage('✅ Prono sauvegardé. Modifiable avant le coup d’envoi.');
      reset({ fixtureId: '', homeScore: 1, awayScore: 0 });
      await refreshFixtures(activeCompetitionId);
    } else {
      const body = await res.json();
      setMessage(`❌ ${body?.error?.message ?? body?.error ?? 'Impossible de sauvegarder le prono.'}`);
    }
    setSavingFixtureId('');
  };

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
        {[['upcoming', 'Matchs à venir'], ['past', 'Matchs passés']].map(([value, label]) => (
          <button className={`rounded-2xl px-3 py-3 text-sm font-black ${tab === value ? 'bg-brand text-black' : 'border border-white/10 bg-black text-white'}`} key={value} onClick={() => setTab(value as Tab)} type="button">{label}</button>
        ))}
      </section>

      {message && <p className="rounded-2xl border border-brand bg-brand/10 px-4 py-3 text-sm font-semibold text-orange-100">{message}</p>}
      {errors.fixtureId && <p className="text-sm font-bold text-rose-300">Sélectionne un match avant de sauvegarder.</p>}
      {loading && <section className="card text-sm text-zinc-300">Chargement des matchs...</section>}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {visibleFixtures.map((f) => {
          const status = getStatus(f.state);
          const isSelected = selectedFixtureId === f.id;
          const canEdit = f.state === 'open' || f.state === 'saved';
          return (
            <article className="card" key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{new Date(f.kickoff).toLocaleString()}</p>
                  <h3 className="mt-1 text-xl font-black">{f.home} <span className="text-zinc-400">vs</span> {f.away}</h3>
                </div>
                <span className={`game-chip ${status.tone}`}>{status.label}</span>
              </div>
              {f.savedPrediction && <p className="mt-3 text-sm font-semibold text-orange-100">Ton prono: {f.savedPrediction.homeScore}-{f.savedPrediction.awayScore}</p>}
              {f.finalScore && <div className="mt-2 rounded-2xl border border-white/15 bg-black p-3 text-sm"><p>Score final: <strong>{f.finalScore.homeScore}-{f.finalScore.awayScore}</strong></p><p>Points gagnés: <strong className="text-brand">{f.points}</strong></p></div>}
              {canEdit && (
                <>
                  <button className={`mt-3 w-full rounded-2xl border px-3 py-2 text-sm font-black ${isSelected ? 'border-brand bg-brand/20 text-brand' : 'border-white/20 bg-black text-white'}`} onClick={() => { setValue('fixtureId', f.id); setValue('homeScore', f.savedPrediction?.homeScore ?? 1); setValue('awayScore', f.savedPrediction?.awayScore ?? 0); }} type="button">{isSelected ? 'Match sélectionné' : 'Prédire ce match'}</button>
                  {isSelected && <div className="mt-3 space-y-2 rounded-2xl border border-white/20 bg-black p-3"><div className="grid grid-cols-2 gap-2"><input className="h-12 rounded-2xl border border-white/20 bg-zinc-900 px-3 text-center text-lg font-black" type="number" min={0} max={20} onChange={(e) => setValue('homeScore', Number(e.target.value))} value={watch('homeScore')} /><input className="h-12 rounded-2xl border border-white/20 bg-zinc-900 px-3 text-center text-lg font-black" type="number" min={0} max={20} onChange={(e) => setValue('awayScore', Number(e.target.value))} value={watch('awayScore')} /></div><button className="cta-primary w-full" disabled={savingFixtureId === f.id} type="submit">{savingFixtureId === f.id ? 'Sauvegarde...' : f.savedPrediction ? 'Mettre à jour' : 'Sauvegarder'}</button></div>}
                </>
              )}
            </article>
          );
        })}
      </form>

      <PlayerNav />
    </main>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-4 text-sm">Chargement...</main>}>
      <PredictionsContent />
    </Suspense>
  );
}
