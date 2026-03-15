'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setError('');

    if (username.trim().length < 3) {
      setError('Le pseudo doit contenir au moins 3 caractères.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? 'Impossible de créer le compte.');
        return;
      }
      router.push('/auth/signin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <div className="card space-y-3">
        <input
          className="w-full rounded border p-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p className="rounded border border-red-500/60 bg-red-950/50 p-2 text-sm font-semibold text-red-300">{error}</p>}
        <button className="w-full rounded bg-brand p-2 text-white" disabled={isLoading} onClick={submit} type="button">
          {isLoading ? 'Creating account...' : 'Sign up'}
        </button>
        <Link className="block text-center text-sm font-bold text-brand" href="/auth/signin">Back to sign in</Link>
      </div>
    </main>
  );
}
