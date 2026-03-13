'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
      callbackUrl: '/daily',
    });

    if (result?.error) {
      setError('Pseudo ou mot de passe invalide.');
      setPending(false);
      return;
    }

    router.push('/daily');
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-3xl bg-white p-6 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Telcom Goal Predictor</p>
        <h1 className="mt-2 text-3xl font-black">Connexion</h1>
        <p className="mt-2 text-sm font-medium text-zinc-700">Connectez-vous pour reprendre vos pronostics.</p>
      </section>

      <section className="card mt-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Pseudo"
            required
            value={username}
          />
          <input
            className="w-full rounded-2xl border border-white/15 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-brand"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            required
            type="password"
            value={password}
          />
          {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
          <button className="cta-primary w-full" disabled={pending} type="submit">
            {pending ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-300">
          Nouveau joueur ?{' '}
          <Link className="font-black text-brand" href="/">
            Créer un compte
          </Link>
        </p>
      </section>
    </main>
  );
}
