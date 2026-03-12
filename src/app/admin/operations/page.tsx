'use client';

import { useState } from 'react';

export default function AdminOperationsPage() {
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingPurge, setLoadingPurge] = useState(false);
  const [result, setResult] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');

  const runSync = async () => {
    setLoadingSync(true);
    setResult('');
    const res = await fetch('/api/admin/sync', { method: 'POST' });
    const body = await res.json();
    if (res.ok) {
      setResult(`✅ Sync ok • compétitions: ${body.data.competitionsSynced}, matchs créés: ${body.data.fixturesCreated}, matchs mis à jour: ${body.data.fixturesUpdated}`);
    } else {
      setResult(`❌ Sync échouée: ${body?.error?.message ?? 'Erreur inconnue'}`);
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
    const body = await res.json();
    if (res.ok) {
      setResult(`✅ Purge OK • predictions:${body.data.predictionsDeleted}, challengeFixtures:${body.data.challengeFixturesDeleted}, fixtures:${body.data.fixturesDeleted}, competitions:${body.data.competitionsDeleted}, teams:${body.data.teamsDeleted}`);
      setConfirmText('');
    } else {
      setResult(`❌ Purge échouée: ${body?.error?.message ?? 'Erreur inconnue'}`);
    }
    setLoadingPurge(false);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="rounded-2xl bg-white p-4">
        <h1 className="text-2xl font-bold">Opérations admin</h1>
        <p className="text-sm text-slate-600">Sync manuelle API football et purge POC.</p>
      </div>

      <section className="rounded-2xl bg-white p-4">
        <h2 className="text-lg font-bold">Actualiser les matchs depuis l’API</h2>
        <p className="text-sm text-slate-600">Relance une synchro sans dupliquer les entrées existantes.</p>
        <button onClick={runSync} disabled={loadingSync} className="mt-3 rounded bg-brand px-4 py-2 font-bold text-black">
          {loadingSync ? 'Synchronisation...' : 'Actualiser les matchs depuis l’API'}
        </button>
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
