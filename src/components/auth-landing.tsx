'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

type Mode = 'login' | 'signup';

export function AuthLanding() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === 'login' ? 'Connexion' : 'Créer un compte'), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          setError(payload.error ?? 'Impossible de créer le compte.');
          setPending(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('Email ou mot de passe invalide.');
        setPending(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Réessayez.');
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-3xl bg-white p-6 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Telcom Goal Predictor</p>
        <h1 className="mt-2 text-3xl font-black">Le jeu de pronostics foot.</h1>
        <p className="mt-2 text-sm font-medium text-zinc-700">Prédisez les matchs, marquez des points et grimpez au classement.</p>
      </section>

      <section className="card mt-4">
        <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-zinc-900 p-1">
          <button
            className={`rounded-xl px-3 py-2 text-sm font-black ${mode === 'login' ? 'bg-brand text-black' : 'text-white/80'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm font-black ${mode === 'signup' ? 'bg-brand text-black' : 'text-white/80'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <h2 className="text-lg font-black">{title}</h2>

          {mode === 'signup' && (
            <input
              className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Nom joueur"
              required
              value={displayName}
            />
          )}

          <input
            className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />

          <input
            className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            required
            type="password"
            value={password}
          />

          {error && <p className="text-xs font-semibold text-red-300">{error}</p>}

          <button className="cta-primary w-full" disabled={pending} type="submit">
            {pending ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </section>
    </main>
  );
}
