import { UserRole, UserStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function updateUser(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const role = String(formData.get('role') ?? UserRole.PLAYER) as UserRole;
  const status = String(formData.get('status') ?? UserStatus.ACTIVE) as UserStatus;
  const resetCountry = String(formData.get('resetCountry') ?? 'false') === 'true';
  const resetStats = String(formData.get('resetStats') ?? 'false') === 'true';

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { role, status } });

    if (resetCountry || resetStats) {
      await tx.profile.updateMany({
        where: { userId: id },
        data: {
          ...(resetCountry ? { countryId: null, cityId: null } : {}),
          ...(resetStats
            ? {
              totalPredictions: 0,
              exactHits: 0,
              totalPoints: 0,
              accuracyPct: 0,
              currentStreak: 0,
              bestStreak: 0,
              bestLeaderboardRank: null,
              level: 'Rookie',
            }
            : {}),
        },
      });
    }

    await tx.auditLog.create({
      data: { action: 'ADMIN_USER_UPDATE', targetType: 'USER', targetId: id, metadata: { role, status, resetCountry, resetStats } },
    });
  });

  revalidatePath('/admin/users');
}

export default async function UsersPage({ searchParams }: { searchParams?: { q?: string | string[]; role?: string | string[]; status?: string | string[]; country?: string | string[] } }) {
  const query = (Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q) ?? '';
  const role = (Array.isArray(searchParams?.role) ? searchParams?.role[0] : searchParams?.role) ?? '';
  const status = (Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status) ?? '';
  const country = (Array.isArray(searchParams?.country) ? searchParams?.country[0] : searchParams?.country) ?? '';

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as UserRole } : {}),
      ...(status ? { status: status as UserStatus } : {}),
      ...(country ? { profile: { country: { code: country } } } : {}),
      ...(query
        ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { profile: { displayName: { contains: query, mode: 'insensitive' } } },
          ],
        }
        : {}),
    },
    include: {
      profile: { include: { country: true } },
      predictions: { select: { id: true }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' }, take: 80 });

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Users</h1>

      <form className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-5" method="GET">
        <input name="q" defaultValue={query} className="rounded border p-2" placeholder="Recherche user/email" />
        <select className="rounded border p-2" name="role" defaultValue={role}><option value="">Tous rôles</option>{Object.values(UserRole).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select className="rounded border p-2" name="status" defaultValue={status}><option value="">Tous statuts</option>{Object.values(UserStatus).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select className="rounded border p-2" name="country" defaultValue={country}><option value="">Tous pays</option>{countries.map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}</select>
        <button className="rounded border px-3 py-2 font-semibold" type="submit">Filtrer</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Profil</th><th>Stats</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t align-top">
                <td className="py-2">
                  <p className="font-semibold">{user.profile?.displayName ?? user.username}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                  <p className="text-xs text-zinc-500">{user.profile?.country?.name ?? 'No country'}</p>
                </td>
                <td>{user.profile?.totalPoints ?? 0} pts<br />{user.profile?.totalPredictions ?? 0} pronos</td>
                <td>{user.role} • {user.status}<br /><span className="text-xs">recent activity: {user.predictions.length} pronos</span></td>
                <td>
                  <form action={updateUser} className="space-y-1">
                    <input type="hidden" name="id" value={user.id} />
                    <select name="role" className="rounded border p-1" defaultValue={user.role}>{Object.values(UserRole).map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <select name="status" className="rounded border p-1" defaultValue={user.status}>{Object.values(UserStatus).map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <select name="resetCountry" className="rounded border p-1" defaultValue="false"><option value="false">Garder pays</option><option value="true">Reset pays</option></select>
                    <select name="resetStats" className="rounded border p-1" defaultValue="false"><option value="false">Garder stats</option><option value="true">Reset stats</option></select>
                    <button className="rounded border px-2 py-1 text-xs font-semibold" type="submit">Mettre à jour</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
