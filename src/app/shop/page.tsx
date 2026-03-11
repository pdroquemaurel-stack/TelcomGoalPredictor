import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopPage() {
  const products = await prisma.product.findMany({ where: { active: true } });
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-5">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 to-yellow-50 p-5">
        <p className="text-xs uppercase tracking-wide text-amber-800">Sponsor Challenges</p>
        <h1 className="mt-1 text-2xl font-bold text-amber-950">Challenge Center</h1>
        <p className="mt-1 text-sm text-amber-900">Join branded challenges, complete prediction goals, and unlock rewards.</p>
      </header>
      <AdSlotView code="SHOP_SPONSOR" />
      {products.map((p) => (
        <div key={p.id} className="card flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-slate-600">{p.description}</p>
            <p className="mt-1 text-xs text-emerald-700">Status: Open challenge</p>
          </div>
          <button className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">Join</button>
        </div>
      ))}
      {products.length === 0 && <div className="card text-sm text-slate-600">No active challenge right now. New sponsor campaigns arrive weekly.</div>}
      <PlayerNav />
    </main>
  );
}
