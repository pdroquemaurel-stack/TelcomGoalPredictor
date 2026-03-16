'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
      <div className="card space-y-3">
        <input className="w-full rounded border border-white/20 bg-zinc-900 p-2 text-zinc-100 placeholder:text-zinc-500" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <div className="flex items-center gap-2 rounded border border-white/20 bg-zinc-900 p-2">
          <input
            className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-500 outline-none"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="text-lg leading-none text-zinc-300"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <button className="w-full rounded bg-brand p-2 text-white" onClick={() => signIn('credentials', { username, password, callbackUrl: '/' })}>Continue</button>
        <Link className="block text-center text-sm font-bold text-brand" href="/auth/signup">Create account</Link>
      </div>
    </main>
  );
}
