'use client';

import { useState } from 'react';
import { getTeamInitials } from '@/lib/team-logo';
import { formatMatchDateTime } from '@/lib/date-format';

type Prediction = { homeScore: number; awayScore: number } | null;

type FixturePredictionCardProps = {
  fixtureId: string;
  kickoff: string | Date;
  competition: string;
  home: string;
  homeLogoUrl: string;
  away: string;
  awayLogoUrl: string;
  savedPrediction: Prediction;
  editable: boolean;
  onSaved?: (prediction: { homeScore: number; awayScore: number }) => void;
};

function getPredictionColorClasses(prediction: Prediction) {
  if (!prediction) return { home: 'text-zinc-200', away: 'text-zinc-200' };
  if (prediction.homeScore > prediction.awayScore) return { home: 'text-green-500', away: 'text-red-500' };
  if (prediction.homeScore < prediction.awayScore) return { home: 'text-red-500', away: 'text-green-500' };
  return { home: 'text-orange-400', away: 'text-orange-400' };
}

function TeamAvatar({ name, logoUrl }: { name: string; logoUrl: string }) {
  const initials = getTeamInitials(name);
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white text-xs font-black text-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${name} logo`}
        className="h-10 w-10 rounded-full object-contain"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
          const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
          if (fallback) fallback.style.display = 'flex';
        }}
        src={logoUrl}
      />
      <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-black">{initials}</span>
    </span>
  );
}

export function FixturePredictionCard(props: FixturePredictionCardProps) {
  const { fixtureId, kickoff, competition, home, homeLogoUrl, away, awayLogoUrl, editable, onSaved } = props;
  const [prediction, setPrediction] = useState<Prediction>(props.savedPrediction);
  const [homeScore, setHomeScore] = useState(String(props.savedPrediction?.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(props.savedPrediction?.awayScore ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const colors = getPredictionColorClasses(prediction);

  const save = async () => {
    if (!editable) return;
    setSaving(true);
    setError('');
    const payload = {
      fixtureId,
      homeScore: Math.max(0, Math.min(20, Number(homeScore))),
      awayScore: Math.max(0, Math.min(20, Number(awayScore))),
    };

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body?.error?.message ?? 'Erreur sauvegarde');
      setSaving(false);
      return;
    }

    const nextPrediction = { homeScore: payload.homeScore, awayScore: payload.awayScore };
    setPrediction(nextPrediction);
    onSaved?.(nextPrediction);
    setSaving(false);
  };

  return (
    <article className="rounded-2xl border border-white/15 bg-black p-3">
      <p className="text-xs text-zinc-400">{formatMatchDateTime(kickoff)} • {competition}</p>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2">
          <TeamAvatar logoUrl={homeLogoUrl} name={home} />
          <p className="text-sm font-bold leading-tight">{home}</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-zinc-900 px-2 py-1">
          {editable ? (
            <>
              <input className="h-8 w-10 rounded-lg border border-white/20 bg-black text-center text-sm font-black" max={20} min={0} onChange={(e) => setHomeScore(e.target.value)} type="number" value={homeScore} />
              <span className="text-zinc-500">-</span>
              <input className="h-8 w-10 rounded-lg border border-white/20 bg-black text-center text-sm font-black" max={20} min={0} onChange={(e) => setAwayScore(e.target.value)} type="number" value={awayScore} />
              <button className="ml-1 rounded-md bg-brand px-2 py-1 text-[10px] font-black text-black disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? '...' : 'OK'}</button>
            </>
          ) : prediction ? (
            <>
              <span className={colors.home}>{prediction.homeScore}</span>
              <span className="text-zinc-500">-</span>
              <span className={colors.away}>{prediction.awayScore}</span>
            </>
          ) : (
            <span className="text-zinc-300">? - ?</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 text-right">
          <p className="text-sm font-bold leading-tight">{away}</p>
          <TeamAvatar logoUrl={awayLogoUrl} name={away} />
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-rose-400">{error}</p>}
    </article>
  );
}
