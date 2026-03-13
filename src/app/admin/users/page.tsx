import { AdminDeleteUserButton } from '@/components/admin-delete-user-button';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const users = await prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: 'asc' }, take: 100 });

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Username</th>
              <th>Email</th>
              <th>Points</th>
              <th>Predictions</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="py-2">{user.username}</td>
                <td>{user.email ?? '—'}</td>
                <td>{user.profile?.totalPoints ?? 0}</td>
                <td>{user.profile?.totalPredictions ?? 0}</td>
                <td>
                  <AdminDeleteUserButton userId={user.id} username={user.username} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
