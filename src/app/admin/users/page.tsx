import { AdminUsersTable } from '@/components/admin-users-table';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Users</h1>
      <AdminUsersTable
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.profile?.displayName ?? null,
          totalPoints: user.profile?.totalPoints ?? 0,
          totalPredictions: user.profile?.totalPredictions ?? 0,
        }))}
      />
    </div>
  );
}
