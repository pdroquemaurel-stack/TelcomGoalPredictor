'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type UserRow = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  totalPoints: number;
  totalPredictions: number;
};

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (userId: string, username: string) => {
    const confirmed = window.confirm(`Supprimer l'utilisateur @${username} et toutes ses données ?`);
    if (!confirmed) return;

    setDeletingId(userId);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    setDeletingId(null);
    window.alert('Suppression impossible.');
  };

  return (
    <div className="overflow-auto rounded-2xl bg-white p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Username</th>
            <th>Email</th>
            <th>Points</th>
            <th>Predictions</th>
            <th aria-label="Delete" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="py-2">{user.displayName ?? user.username}</td>
              <td>{user.email}</td>
              <td>{user.totalPoints}</td>
              <td>{user.totalPredictions}</td>
              <td className="text-right">
                <button
                  aria-label={`Supprimer ${user.username}`}
                  className="rounded-full px-2 py-1 text-lg font-black text-red-600 hover:bg-red-100"
                  disabled={deletingId === user.id}
                  onClick={() => handleDelete(user.id, user.username)}
                  type="button"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
