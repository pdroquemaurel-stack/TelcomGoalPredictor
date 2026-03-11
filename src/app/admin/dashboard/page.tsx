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
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="card">Total users: {users}</div>
        <div className="card">Predictions submitted: {predictions}</div>
        <div className="card">Active fixtures: {fixtures}</div>
        <div className="card">Ad slots: {adSlots}</div>
        <div className="card">Sponsor campaigns: {campaigns}</div>
        <div className="card">Recent activity placeholder</div>
      </div>
    </div>
  );
}
