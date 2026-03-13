'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function AuthLanding() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const normalizedUsername = username.trim();
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, password }),
      });

      if (!signupResponse.ok) {
        const payload = await signupResponse.json().catch(() => ({}));
        setError(payload.error ?? 'Impossible de créer le compte.');
        setPending(false);
        return;
      }

      const result = await signIn('credentials', {
        username: normalizedUsername,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Compte créé, mais connexion impossible. Réessayez.');
        setPending(false);
        return;
      }

      router.push('/daily');
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
        <h1 className="mt-2 text-3xl font-black">Créer un compte</h1>
        <p className="mt-2 text-sm font-medium text-zinc-700">Rejoignez le jeu de pronostics en quelques secondes.</p>
      </section>

      <section className="card mt-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            minLength={3}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Pseudo"
            required
            value={username}
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
            {pending ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-300">
          Déjà inscrit ?{' '}
          <Link className="font-black text-brand" href="/auth/signin">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}
