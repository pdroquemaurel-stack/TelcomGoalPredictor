'use client';

import { useState } from 'react';

export function InviteAcceptCard({ code, inviterName }: { code: string; inviterName: string }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    setStatus('');

    const response = await fetch('/api/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const body = await response.json();
    if (!response.ok) {
      setStatus(body?.error?.message ?? 'Impossible d’accepter l’invitation.');
      setLoading(false);
      return;
    }

    if (body?.data?.status === 'already_friends') {
      setStatus(`Vous êtes déjà ami avec ${inviterName}.`);
    } else {
      setStatus(`Invitation acceptée. Vous êtes désormais ami avec ${inviterName}.`);
    }

    setLoading(false);
  };

  return (
    <section className="card">
      <button
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-black text-black disabled:opacity-70"
        disabled={loading}
        onClick={accept}
        type="button"
      >
        {loading ? 'Validation…' : 'Accepter l’invitation'}
      </button>
      {status && <p className="mt-3 text-sm text-zinc-200">{status}</p>}
    </section>
  );
}
