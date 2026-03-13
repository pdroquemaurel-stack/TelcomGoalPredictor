'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Admin123!');

  const handleSignIn = () => {
    const callbackUrl = typeof window === 'undefined'
      ? '/'
      : new URLSearchParams(window.location.search).get('callbackUrl') || '/';

    signIn('credentials', { email, password, callbackUrl });
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
      <div className="card space-y-3">
        <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button className="w-full rounded bg-brand p-2 text-white" onClick={handleSignIn}>Continue</button>
      </div>
    </main>
  );
}
