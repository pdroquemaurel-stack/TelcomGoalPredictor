import Link from 'next/link';
import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [fixtures, top, challengeProducts, totalPlayers] = await Promise.all([
    prisma.fixture.findMany({ where: { visible: true }, include: { homeTeam: true, awayTeam: true, competition: true }, orderBy: [{ featured: 'desc' }, { utcKickoff: 'asc' }], take: 4 }),
    prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 5 }),
    prisma.product.findMany({ where: { active: true }, take: 1 }),
    prisma.profile.count(),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 pb-24 pt-5">
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-emerald-700 p-5 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Pan-African Matchday Challenge</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">Predict. Compete. Rise to the top.</h1>
        <p className="mt-3 text-sm text-emerald-50">Join friends and fans across Africa, score points every matchday, and climb sponsor-backed rankings.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">+25</p><p>Top weekly points</p></div>
          <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">3</p><p>Live challenges</p></div>
          <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">{totalPlayers}</p><p>Players active</p></div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link href="/predictions" className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white">Make Predictions</Link>
          <Link href="/shop" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900">Join Challenge</Link>
          <Link href="/leaderboards" className="rounded-xl border border-white/40 px-4 py-3 text-center text-sm font-semibold">View Rankings</Link>
        </div>
      </section>

      <AdSlotView code="HOME_TOP_BANNER" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Upcoming Matches</h2>
          <Link href="/predictions" className="text-sm font-medium text-brand">Predict now</Link>
        </div>
        <div className="space-y-3">
          {fixtures.map((f) => (
            <article key={f.id} className="card">
              <p className="text-xs uppercase tracking-wide text-slate-500">{f.competition.name}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-semibold">{f.homeTeam.name} <span className="text-slate-400">vs</span> {f.awayTeam.name}</p>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Open</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{new Date(f.utcKickoff).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-xs uppercase tracking-wide text-amber-700">Sponsor Challenge</p>
          <h3 className="mt-1 text-lg font-bold text-amber-900">{challengeProducts[0]?.name ?? 'MTN Weekend Boost'}</h3>
          <p className="mt-2 text-sm text-amber-800">{challengeProducts[0]?.description ?? 'Make 5 predictions this weekend and unlock bonus points plus airtime rewards.'}</p>
          <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-amber-900 underline">Join challenge</Link>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Your Progress Teaser</p>
          <h3 className="mt-1 font-semibold">Weekly Momentum</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>• You climbed 3 places this week.</li>
            <li>• 2 badges close to unlocking.</li>
            <li>• 1 more prediction to complete your daily streak.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Leaderboard Preview</h2>
            <Link href="/leaderboards" className="text-xs text-brand">Full table</Link>
          </div>
          <div className="mt-2 space-y-2">
            {top.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p><span className="font-semibold">#{i + 1}</span> {u.displayName}</p>
                <p className="font-semibold text-brand">{u.totalPoints} pts</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Leagues & Friends</h2>
            <Link href="/friends" className="text-xs text-brand">View leagues</Link>
          </div>
          <div className="mt-2 space-y-2">
            {[
              { name: 'City Rivals', members: 28 },
              { name: 'Campus Derby League', members: 41 },
              { name: 'Weekend Legends', members: 19 },
            ].map((league) => (
              <div key={league.name} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <p className="font-semibold">{league.name}</p>
                <p className="text-xs text-slate-500">{league.members} members • Competitive ladder active</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PlayerNav />
    </main>
  );
}
