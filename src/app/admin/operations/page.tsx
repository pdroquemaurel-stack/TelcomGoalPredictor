'use client';

import { useEffect, useState } from 'react';
import { adminSyncResultSchema, operationsSummarySchema, type OperationsSummary } from '@/lib/admin-sync-contract';

type ApiFailure = { error?: { message?: string; details?: string } };

export default function AdminOperationsPage() {
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingPurge, setLoadingPurge] = useState(false);
  const [result, setResult] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [summary, setSummary] = useState<OperationsSummary | null>(null);

  const loadSummary = async () => {
    const response = await fetch('/api/admin/operations/summary', { cache: 'no-store' });
    const body = await response.json() as { data?: unknown };
    if (response.ok && body.data) {
      const parsed = operationsSummarySchema.safeParse(body.data);
      if (parsed.success) {
        setSummary(parsed.data);
        return;
      }

      setResult('❌ Résumé opérations invalide (contrat runtime).');
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runSync = async () => {
    setLoadingSync(true);
    setResult('');
    const res = await fetch('/api/admin/sync', { method: 'POST' });
    const body = await res.json() as { data?: unknown } & ApiFailure;
    if (res.ok && body.data) {
      const parsed = adminSyncResultSchema.safeParse(body.data);
      if (!parsed.success) {
        setResult('❌ Réponse de sync invalide (contrat runtime).');
        setLoadingSync(false);
        return;
      }

      const warningSuffix = parsed.data.errors?.length
        ? ` • ⚠️ anomalies: ${parsed.data.errors.length}`
        : '';
      setResult(`✅ Sync ok • compétitions: ${parsed.data.competitionsSynced}, matchs créés: ${parsed.data.fixturesCreated}, matchs mis à jour: ${parsed.data.fixturesUpdated}, matchs ignorés: ${parsed.data.fixturesSkipped}, settled: ${parsed.data.settlement.settledFixturesCount}, resettled: ${parsed.data.settlement.resettledFixturesCount}${warningSuffix}`);
      await loadSummary();
    } else {
      const message = body?.error?.message ?? 'Erreur inconnue';
      const details = typeof body?.error?.details === 'string' && body.error.details.length > 0
        ? ` Détail: ${body.error.details}`
        : '';
      setResult(`❌ Sync échouée: ${message}${details}`);
    }
    setLoadingSync(false);
  };

  const runPurge = async () => {
    setLoadingPurge(true);
    setResult('');
    const res = await fetch('/api/admin/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: confirmText }),
    });
    const body = await res.json() as { data?: { predictionsDeleted: number; challengeFixturesDeleted: number; fixturesDeleted: number; competitionsDeleted: number; teamsDeleted: number }; error?: { message?: string } };
    if (res.ok && body.data) {
      setResult(`✅ Purge OK • predictions:${body.data.predictionsDeleted}, challengeFixtures:${body.data.challengeFixturesDeleted}, fixtures:${body.data.fixturesDeleted}, competitions:${body.data.competitionsDeleted}, teams:${body.data.teamsDeleted}`);
      setConfirmText('');
      await loadSummary();
    } else {
      setResult(`❌ Purge échouée: ${body?.error?.message ?? 'Erreur inconnue'}`);
    }
    setLoadingPurge(false);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="rounded-2xl bg-white p-4">
        <h1 className="text-2xl font-bold">Centre des opérations</h1>
        <p className="text-sm text-slate-600">Pilote la synchronisation, surveille les KPI système et corrige rapidement les matchs problématiques.</p>
      </div>

      {summary && (
        <section className="grid gap-3 md:grid-cols-4">
          {Object.entries({
            Competitions: summary.competitions,
            Fixtures: summary.fixtures,
            'Fixtures visibles': summary.visibleFixtures,
            'Fixtures live': summary.liveFixtures,
            'Fixtures terminées': summary.finishedFixtures,
            'Terminées sans score': summary.finishedWithoutScore,
            'Terminées non settled': summary.unsettledFinished,
            Users: summary.users,
            Predictions: summary.predictions,
            Badges: summary.badges,
            'Daily competitions': summary.dailyCompetitions,
            'Challenges actifs': summary.activeChallenges,
          }).map(([label, value]) => (
            <div className="rounded-2xl bg-white p-3" key={label}><p className="text-xs uppercase text-slate-500">{label}</p><p className="text-2xl font-black">{value}</p></div>
          ))}
        </section>
      )}

      <section className="rounded-2xl bg-white p-4">
        <h2 className="text-lg font-bold">Sync manuelle</h2>
        <p className="text-sm text-slate-600">Dernière sync: {summary?.lastSyncAt ? new Date(summary.lastSyncAt).toLocaleString() : 'Aucune'}</p>
        <button onClick={runSync} disabled={loadingSync} className="mt-3 rounded bg-brand px-4 py-2 font-bold text-black">
          {loadingSync ? 'Synchronisation...' : 'Actualiser les matchs depuis l’API'}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4">
        <h2 className="text-lg font-bold">Fixtures problématiques</h2>
        <div className="mt-2 space-y-2 text-sm">
          {(summary?.problematicFixtures ?? []).map((fixture) => (
            <div key={fixture.id} className="rounded border p-2">
              <p className="font-semibold">{fixture.match} • {fixture.competition}</p>
              <p className="text-xs text-slate-600">State={fixture.state} | score={fixture.hasScore ? 'ok' : 'missing'} | visible={String(fixture.visible)} | predictionEnabled={String(fixture.predictionEnabled)}</p>
            </div>
          ))}
          {!summary?.problematicFixtures?.length && <p className="text-slate-500">Aucune fixture problématique détectée.</p>}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
        <h2 className="text-lg font-bold text-rose-700">Danger zone — purge compétitions/matchs</h2>
        <p className="text-sm text-rose-700">Cette action supprime compétitions, équipes, matchs, challenges liés et pronostics associés.</p>
        <p className="mt-2 text-sm font-semibold text-rose-800">Tape DELETE pour confirmer.</p>
        <input className="mt-2 w-full rounded border border-rose-300 p-2" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
        <button onClick={runPurge} disabled={loadingPurge || confirmText !== 'DELETE'} className="mt-3 rounded bg-rose-600 px-4 py-2 font-bold text-white disabled:opacity-60">
          {loadingPurge ? 'Suppression...' : 'Supprimer les compétitions et matchs'}
        </button>
      </section>

      {result && <p className="rounded-xl bg-black/90 px-3 py-2 text-sm font-semibold text-white">{result}</p>}
    </div>
  );
}
