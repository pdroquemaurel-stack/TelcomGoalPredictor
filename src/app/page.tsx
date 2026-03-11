import Link from 'next/link';
import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const fixtures = await prisma.fixture.findMany({ where: { visible: true }, include: { homeTeam: true, awayTeam: true, competition: true }, orderBy: [{ featured: 'desc' }, { utcKickoff: 'asc' }], take: 6 });
  const top = await prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 5 });

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">Pan-African Football Predictor</h1>
      <p className="text-sm text-slate-600">Predict matches, climb rankings, and challenge friends.</p>
      <AdSlotView code="HOME_TOP_BANNER" />
      <section className="card">
        <h2 className="font-semibold">Today’s matches</h2>
        <div className="mt-2 space-y-2 text-sm">
          {fixtures.map((f) => (
            <div key={f.id} className="flex justify-between">
              <span>{f.homeTeam.name} vs {f.awayTeam.name}</span>
              <span>{new Date(f.utcKickoff).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Link href="/predictions" className="card">Make Predictions</Link>
        <Link href="/leaderboards" className="card">Top Predictors</Link>
        <Link href="/friends" className="card">Your Leagues</Link>
        <Link href="/shop" className="card">Brand Challenge</Link>
      </section>
      <section className="card">
        <h2 className="font-semibold">Top predictors</h2>
        {top.map((u, i) => <p key={u.id} className="text-sm">#{i + 1} {u.displayName} - {u.totalPoints} pts</p>)}
      </section>
      <PlayerNav />
    </main>
  );
}
