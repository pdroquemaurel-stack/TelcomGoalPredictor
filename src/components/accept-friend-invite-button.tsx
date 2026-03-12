'use client';

import { useState } from 'react';

export function AcceptFriendInviteButton({ inviterId }: { inviterId: string }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviterId }),
    });
    const body = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(body?.error?.message ?? 'Impossible de traiter cette invitation.');
      return;
    }

    setMessage(body?.data?.message ?? 'Invitation acceptée.');
  };

  return (
    <div className="space-y-2">
      <button className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-black text-black" disabled={loading} onClick={accept} type="button">
        {loading ? 'Validation…' : 'Accepter cette amitié'}
      </button>
      {message && <p className="text-xs text-zinc-300">{message}</p>}
    </div>
  );
}
