import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function ShopPage() {
  const products = await prisma.product.findMany({ where: { active: true } });
  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold">Bonus Shop</h1>
      <AdSlotView code="SHOP_SPONSOR" />
      {products.map((p) => (
        <div key={p.id} className="card flex items-center justify-between">
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs">{p.description}</p>
          </div>
          <button className="rounded bg-brand px-3 py-2 text-sm text-white">Buy (mock)</button>
        </div>
      ))}
      <PlayerNav />
    </main>
  );
}
