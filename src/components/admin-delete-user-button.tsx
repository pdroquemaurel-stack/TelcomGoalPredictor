'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminDeleteUserButton({ userId, username }: { userId: string; username: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const remove = async () => {
    const yes = window.confirm(`Supprimer définitivement @${username} ?`);
    if (!yes) return;
    setPending(true);

    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    setPending(false);

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <button
      aria-label={`Supprimer ${username}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white"
      disabled={pending}
      onClick={remove}
      type="button"
    >
      ×
    </button>
  );
}
