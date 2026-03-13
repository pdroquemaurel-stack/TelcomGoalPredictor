'use client';

import { useMemo, useState } from 'react';

export function FriendInviteModal({ friendCode }: { friendCode: string }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/invite/${friendCode}`;
    return `${window.location.origin}/invite/${friendCode}`;
  }, [friendCode]);

  const whatsappHref = useMemo(() => {
    const text = `Rejoins-moi sur TelcomGoalPredictor pour le classement amis ⚽ ${inviteUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [inviteUrl]);

  const inviteByUsername = async () => {
    setLoading(true);
    setMessage('');

    const response = await fetch('/api/friends/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const body = await response.json();
    if (!response.ok) {
      setMessage(body?.error?.message ?? 'Invitation impossible.');
      setLoading(false);
      return;
    }

    if (body?.data?.status === 'already_friends') setMessage(`${body.data.displayName} est déjà votre ami.`);
    else if (body?.data?.status === 'pending') setMessage(`Invitation déjà en attente pour ${body.data.displayName}.`);
    else setMessage(`Invitation envoyée à ${body.data.displayName}.`);

    setLoading(false);
  };

  return (
    <>
      <button className="rounded-xl bg-brand px-4 py-2 text-xs font-black text-black" onClick={() => setOpen(true)} type="button">
        Inviter un ami
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Inviter un ami</h3>
              <button className="text-sm text-zinc-400" onClick={() => setOpen(false)} type="button">Fermer</button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">1) Par pseudo</p>
              <div className="flex gap-2">
                <input
                  className="h-10 flex-1 rounded-xl border border-white/20 bg-black px-3 text-sm"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Pseudo de votre ami"
                  value={username}
                />
                <button
                  className="rounded-xl bg-brand px-3 text-xs font-black text-black disabled:opacity-70"
                  disabled={loading || username.trim().length < 2}
                  onClick={inviteByUsername}
                  type="button"
                >
                  Envoyer
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">2) Via WhatsApp</p>
              <a className="block rounded-xl border border-green-500 px-3 py-2 text-center text-sm font-black text-green-400" href={whatsappHref} rel="noreferrer" target="_blank">
                Partager sur WhatsApp
              </a>
              <p className="text-[11px] text-zinc-400">Lien d&apos;invitation: {inviteUrl}</p>
            </div>

            {message && <p className="mt-4 text-sm text-zinc-200">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
