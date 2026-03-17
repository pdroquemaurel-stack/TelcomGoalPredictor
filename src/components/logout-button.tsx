'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      className="w-full rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      type="button"
    >
      Se déconnecter
    </button>
  );
}
