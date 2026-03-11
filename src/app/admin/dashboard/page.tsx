import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [users, predictions, fixtures, competitions] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.fixture.count(),
    prisma.competition.count({ where: { active: true } }),
  ]);

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-600">Vue rapide pour la démo admin.</p>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Users</p><p className="mt-1 text-2xl font-bold">{users}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Competitions</p><p className="mt-1 text-2xl font-bold">{competitions}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Matches</p><p className="mt-1 text-2xl font-bold">{fixtures}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs uppercase text-slate-500">Predictions</p><p className="mt-1 text-2xl font-bold">{predictions}</p></div>
      </div>
    </div>
  );
}
