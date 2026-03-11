import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [users, predictions, fixtures, adSlots, campaigns] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.fixture.count({ where: { predictionEnabled: true } }),
    prisma.adSlot.count(),
    prisma.sponsorCampaign.count(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-slate-600">Operational overview for fixtures, engagement, and sponsor inventory.</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card"><p className="text-xs uppercase text-slate-500">Users</p><p className="mt-1 text-2xl font-bold">{users}</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-500">Predictions</p><p className="mt-1 text-2xl font-bold">{predictions}</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-500">Active Fixtures</p><p className="mt-1 text-2xl font-bold">{fixtures}</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-500">Ad Slots</p><p className="mt-1 text-2xl font-bold">{adSlots}</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-500">Campaigns</p><p className="mt-1 text-2xl font-bold">{campaigns}</p></div>
        <div className="card bg-slate-50"><p className="text-xs uppercase text-slate-500">Activity</p><p className="mt-1 text-sm">Fixture sync, campaign rotation, and leaderboard recalculation are available from sidebar tools.</p></div>
      </div>
    </div>
  );
}
