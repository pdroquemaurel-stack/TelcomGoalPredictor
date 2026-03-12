'use client';

import { useMemo, useState } from 'react';

type Props = {
  friendCode: string;
  defaultAppUrl?: string;
};

export function InviteFriendModal({ friendCode, defaultAppUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return defaultAppUrl ?? '';
  }, [defaultAppUrl]);

  const inviteUrl = `${baseUrl}/invite/${friendCode}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Rejoins-moi sur TelcomGoalPredictor ⚽ ${inviteUrl}`)}`;

  const sendByUsername = async () => {
    setMessage('');
    const response = await fetch('/api/friends/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const body = await response.json();
    if (!response.ok) {
      setMessage(body?.error?.message ?? 'Échec de l’invitation.');
      return;
    }

    setMessage(body?.data?.message ?? 'Invitation envoyée.');
    setUsername('');
  };

  return (
    <>
      <button className="rounded-xl border border-brand/60 bg-brand px-4 py-2 text-sm font-black text-black" onClick={() => setOpen(true)} type="button">
        Inviter un ami
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Inviter un ami</h3>
              <button className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => setOpen(false)} type="button">Fermer</button>
            </div>

            <div className="mt-4 space-y-4">
              <section className="space-y-2 rounded-2xl border border-white/10 p-3">
                <p className="text-sm font-bold">Par pseudo</p>
                <input
                  className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-sm"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Pseudo de votre ami"
                  value={username}
                />
                <button className="w-full rounded-xl bg-brand px-3 py-2 text-sm font-black text-black" onClick={sendByUsername} type="button">
                  Envoyer l’invitation
                </button>
              </section>

              <section className="space-y-2 rounded-2xl border border-white/10 p-3">
                <p className="text-sm font-bold">Via WhatsApp</p>
                <a className="block w-full rounded-xl border border-green-500/50 bg-green-700/30 px-3 py-2 text-center text-sm font-black" href={whatsappHref} rel="noreferrer" target="_blank">
                  Partager sur WhatsApp
                </a>
                <p className="text-[11px] text-zinc-400 break-all">{inviteUrl}</p>
              </section>

              {message && <p className="text-xs text-brand">{message}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
