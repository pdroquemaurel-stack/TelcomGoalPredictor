'use client';

import { useEffect, useRef, useState } from 'react';
import { getTeamInitials } from '@/lib/team-logo';
import { formatMatchDateTime } from '@/lib/date-format';
import { getPredictionScoreColorClasses } from '@/lib/prediction-score-colors';
import { getFixtureLockVisualState } from '@/lib/fixture-lock-visuals';

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
  odds: { homeWin: number; draw: number; awayWin: number };
  isLocked?: boolean;
  onSaved?: (prediction: { homeScore: number; awayScore: number }) => void;
};

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

function LockBadge({ className }: { className: string }) {
  return (
    <span
      aria-label="Pronostic verrouillé"
      className={className}
      role="img"
      title="Pronostic verrouillé"
    >
      🔒
    </span>
  );
}

export function FixturePredictionCard(props: FixturePredictionCardProps) {
  const { fixtureId, kickoff, competition, home, homeLogoUrl, away, awayLogoUrl, editable, onSaved, finalScore, points, odds, isLocked = false } = props;
  const [prediction, setPrediction] = useState<Prediction>(props.savedPrediction);
  const [homeScore, setHomeScore] = useState(props.savedPrediction ? String(props.savedPrediction.homeScore) : '');
  const [awayScore, setAwayScore] = useState(props.savedPrediction ? String(props.savedPrediction.awayScore) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('');
  const awayInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef(props.savedPrediction ? `${props.savedPrediction.homeScore}-${props.savedPrediction.awayScore}` : '');

  const colors = getPredictionScoreColorClasses(prediction);
  const typedHomeValue = toScoreValue(homeScore);
  const typedAwayValue = toScoreValue(awayScore);
  const livePrediction = typedHomeValue !== null && typedAwayValue !== null
    ? { homeScore: typedHomeValue, awayScore: typedAwayValue }
    : null;
  const inputColors = getPredictionScoreColorClasses(livePrediction);
  const lockVisualState = getFixtureLockVisualState(isLocked);

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
    <article className="relative border-b border-white/10 py-3 last:border-b-0" data-locked={isLocked ? 'true' : 'false'}>
      {lockVisualState.showLock && (
        <>
          <div aria-hidden className={lockVisualState.overlayClassName} data-testid="locked-overlay" />
          <LockBadge className={lockVisualState.lockClassName} />
        </>
      )}

      <div className="relative z-0">
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
                    className={`h-9 w-10 rounded-lg border border-white/20 bg-black text-center text-base font-black ${inputColors.home}`}
                    inputMode="numeric"
                    onChange={(e) => handleHomeChange(e.target.value)}
                    placeholder="?"
                    value={homeScore}
                  />
                  <span className="text-zinc-500">-</span>
                  <input
                    ref={awayInputRef}
                    className={`h-9 w-10 rounded-lg border border-white/20 bg-black text-center text-base font-black ${inputColors.away}`}
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

            <div className="mt-1 grid w-full grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-center text-[10px] font-bold text-zinc-200">
              <span>1: {odds.homeWin.toFixed(2)}</span>
              <span>N: {odds.draw.toFixed(2)}</span>
              <span>2: {odds.awayWin.toFixed(2)}</span>
            </div>

            {(saving || saveState) && editable && <p className="text-[10px] text-zinc-400">{saving ? 'Sauvegarde…' : saveState}</p>}
            {finalScore && <p className="text-[10px] text-zinc-300">Final: {finalScore.homeScore}-{finalScore.awayScore} {typeof points === 'number' ? `• ${points} pts` : ''}</p>}
          </div>

          <div className="flex flex-col items-center gap-1">
            <TeamAvatar logoUrl={awayLogoUrl} name={away} />
            <p className="w-full truncate text-center text-[11px] font-semibold text-zinc-200">{away}</p>
          </div>
        </div>
      </div>
      {error && <p className="relative z-0 mt-1 text-center text-xs font-semibold text-rose-400">{error}</p>}
    </article>
  );
}
