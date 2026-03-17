'use client';

import { FormEvent, useMemo, useState } from 'react';

type SearchResult = {
  username: string;
  displayName: string;
};

export function InviteFriendsSheet({ username, friendCode }: { username: string; friendCode: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedQuery) {
      setFeedback('Entre un pseudo exact.');
      setResult(null);
      return;
    }

    setLoading(true);
    setFeedback('');
    setResult(null);

    const response = await fetch(`/api/friends/search?username=${encodeURIComponent(trimmedQuery)}`, { cache: 'no-store' });
    const body = await response.json() as { data?: SearchResult; error?: { message?: string } };
    if (!response.ok) {
      setFeedback(body?.error?.message ?? 'Impossible de faire la recherche.');
      setLoading(false);
      return;
    }

    if (!body.data) {
      setFeedback('Aucun joueur trouvé avec ce pseudo exact.');
      setLoading(false);
      return;
    }

    setResult(body.data);
    setLoading(false);
  };

  const onAdd = async () => {
    if (!result) return;
    setLoading(true);
    setFeedback('');
    const response = await fetch('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: result.username }),
    });
    const body = await response.json() as { data?: { ok: boolean }; error?: { message?: string } };
    if (!response.ok || !body.data?.ok) {
      setFeedback(body?.error?.message ?? 'Ajout impossible pour le moment.');
      setLoading(false);
      return;
    }

    setFeedback(`✅ ${result.username} a été ajouté à tes amis.`);
    setResult(null);
    setQuery('');
    setLoading(false);
  };

  const shareText = `Je te challenge sur TelcomGoalPredictor ⚽️ ! Rejoins-moi avec mon code joueur: ${friendCode}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <button className="cta-primary w-full text-center" type="button" onClick={() => setOpen(true)}>Inviter des amis</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 md:items-center">
          <section className="w-full max-w-md rounded-3xl border border-white/20 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Inviter des amis</h3>
              <button type="button" className="rounded-xl border border-white/20 px-3 py-1 text-xs font-bold" onClick={() => setOpen(false)}>Fermer</button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Ajouter par pseudo exact</p>
              <form className="mt-2 space-y-2" onSubmit={onSearch}>
                <input
                  className="w-full rounded-2xl border border-white/15 bg-black px-3 py-2 text-sm"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pseudo exact"
                  value={query}
                />
                <button className="w-full rounded-2xl border border-white/20 bg-zinc-800 px-3 py-2 text-sm font-black" disabled={loading} type="submit">
                  {loading ? 'Recherche…' : 'Rechercher'}
                </button>
              </form>

              {result && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-black">{result.displayName}</p>
                    <p className="text-xs text-zinc-300">@{result.username}</p>
                  </div>
                  <button className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-black text-black" disabled={loading} onClick={onAdd} type="button">+</button>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Partager ton code joueur</p>
              <p className="mt-2 text-sm text-zinc-200">@{username} • code: <span className="font-black text-brand">{friendCode}</span></p>
              <a className="mt-3 block w-full rounded-2xl bg-brand px-3 py-2 text-center text-sm font-black text-black" href={whatsappLink} rel="noreferrer" target="_blank">
                Partager sur WhatsApp
              </a>
            </div>

            {feedback && <p className="mt-3 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm">{feedback}</p>}
          </section>
        </div>
      )}
    </>
  );
}
