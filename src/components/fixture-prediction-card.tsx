'use client';

import { useEffect, useRef, useState } from 'react';
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
  finalScore?: { homeScore: number; awayScore: number } | null;
  points?: number;
  onSaved?: (prediction: { homeScore: number; awayScore: number }) => void;
  odds?: { homeWin: string; draw: string; awayWin: string } | null;
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
    <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white text-xs font-black text-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${name} logo`}
        className="h-11 w-11 rounded-full object-contain"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
          const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
          if (fallback) fallback.style.display = 'flex';
        }}
        src={logoUrl}
      />
      <span className="hidden h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-black">{initials}</span>
    </span>
  );
}

function toScoreValue(value: string) {
  if (!/^\d{1,2}$/.test(value)) return null;
  return Math.max(0, Math.min(20, Number(value)));
}

export function FixturePredictionCard(props: FixturePredictionCardProps) {
  const { fixtureId, kickoff, competition, home, homeLogoUrl, away, awayLogoUrl, editable, onSaved, finalScore, points, odds } = props;
  const [prediction, setPrediction] = useState<Prediction>(props.savedPrediction);
  const [homeScore, setHomeScore] = useState(props.savedPrediction ? String(props.savedPrediction.homeScore) : '');
  const [awayScore, setAwayScore] = useState(props.savedPrediction ? String(props.savedPrediction.awayScore) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('');
  const awayInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef(props.savedPrediction ? `${props.savedPrediction.homeScore}-${props.savedPrediction.awayScore}` : '');

  const colors = getPredictionColorClasses(prediction);

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!editable) return;
    const homeValue = toScoreValue(homeScore);
    const awayValue = toScoreValue(awayScore);
    if (homeValue === null || awayValue === null) return;

    const key = `${homeValue}-${awayValue}`;
    if (key === lastSavedRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveState('');
      setError('');

      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtureId, homeScore: homeValue, awayScore: awayValue }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body?.error?.message ?? 'Erreur sauvegarde');
        setSaving(false);
        return;
      }

      const nextPrediction = { homeScore: homeValue, awayScore: awayValue };
      setPrediction(nextPrediction);
      lastSavedRef.current = key;
      setSaveState('Enregistré');
      onSaved?.(nextPrediction);
      setSaving(false);
    }, 300);
  }, [awayScore, editable, fixtureId, homeScore, onSaved]);

  const handleHomeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 2);
    setHomeScore(sanitized);
    if (sanitized.length >= 1) awayInputRef.current?.focus();
  };

  const handleAwayChange = (value: string) => {
    setAwayScore(value.replace(/\D/g, '').slice(0, 2));
  };

  return (
    <article className="border-b border-white/10 py-3 last:border-b-0">
      <p className="text-[11px] text-zinc-400">{formatMatchDateTime(kickoff)} • {competition}</p>
      <div className="mt-2 grid grid-cols-[76px_1fr_76px] items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <TeamAvatar logoUrl={homeLogoUrl} name={home} />
          <p className="w-full truncate text-center text-[11px] font-semibold text-zinc-200">{home}</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-zinc-900 px-2 py-1">
            {editable ? (
              <>
                <input
                  className="h-9 w-10 rounded-lg border border-white/20 bg-black text-center text-base font-black"
                  inputMode="numeric"
                  onChange={(e) => handleHomeChange(e.target.value)}
                  placeholder="?"
                  value={homeScore}
                />
                <span className="text-zinc-500">-</span>
                <input
                  ref={awayInputRef}
                  className="h-9 w-10 rounded-lg border border-white/20 bg-black text-center text-base font-black"
                  inputMode="numeric"
                  onChange={(e) => handleAwayChange(e.target.value)}
                  placeholder="?"
                  value={awayScore}
                />
              </>
            ) : prediction ? (
              <>
                <span className={`text-lg font-black ${colors.home}`}>{prediction.homeScore}</span>
                <span className="text-zinc-500">-</span>
                <span className={`text-lg font-black ${colors.away}`}>{prediction.awayScore}</span>
              </>
            ) : (
              <span className="text-zinc-300">? - ?</span>
            )}
          </div>
          {odds && (
            <div className="mt-1 grid w-full grid-cols-3 gap-1 text-center text-[10px] font-semibold text-brand">
              <span>{odds.homeWin}</span>
              <span>{odds.draw}</span>
              <span>{odds.awayWin}</span>
            </div>
          )}
          {(saving || saveState) && editable && <p className="text-[10px] text-zinc-400">{saving ? 'Sauvegarde…' : saveState}</p>}
          {finalScore && <p className="text-[10px] text-zinc-300">Final: {finalScore.homeScore}-{finalScore.awayScore} {typeof points === 'number' ? `• ${points} pts` : ''}</p>}
        </div>

        <div className="flex flex-col items-center gap-1">
          <TeamAvatar logoUrl={awayLogoUrl} name={away} />
          <p className="w-full truncate text-center text-[11px] font-semibold text-zinc-200">{away}</p>
        </div>
      </div>
      {error && <p className="mt-1 text-center text-xs font-semibold text-rose-400">{error}</p>}
    </article>
  );
}
