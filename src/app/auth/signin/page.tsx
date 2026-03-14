'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
      <div className="card space-y-3">
        <input className="w-full rounded border p-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input className="w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button className="w-full rounded bg-brand p-2 text-white" onClick={() => signIn('credentials', { username, password, callbackUrl: '/' })}>Continue</button>
        <Link className="block text-center text-sm font-bold text-brand" href="/auth/signup">Create account</Link>
      </div>
    </main>
  );
}
