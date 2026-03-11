import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeaderboardsPage() {
  const [rows, campaigns, challenges] = await Promise.all([
    prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 20 }),
    prisma.sponsorCampaign.findMany({ where: { active: true }, orderBy: { priority: 'desc' }, take: 3 }),
    prisma.product.findMany({ where: { active: true }, take: 3 }),
  ]);
  const me = rows[2] ?? rows[0];

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Competition Hub</p>
        <h1 className="mt-1 text-3xl font-black">Leaderboard</h1>
        <p className="mt-2 text-sm font-semibold">Classement global, ligues et challenges réunis.</p>
      </header>

      <AdSlotView code="LEADERBOARD_SPONSOR" />

      {me && (
        <section className="card border-brand bg-brand/15">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Ton statut actuel</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-lg font-black">{me.displayName}</p>
              <p className="text-sm text-orange-100">Rank #{rows.findIndex((r) => r.id === me.id) + 1} • Streak {me.currentStreak}</p>
            </div>
            <p className="text-2xl font-black text-brand">{me.totalPoints} pts</p>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="section-title">Global ranking</h2>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.id} className="card flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${i < 3 ? 'bg-brand text-black' : 'bg-zinc-800 text-white'}`}>#{i + 1}</span>
                <div>
                  <p className="font-black">{r.displayName}</p>
                  <p className="text-xs text-zinc-300">Streak {r.currentStreak} • Niveau {r.level}</p>
                </div>
              </div>
              <p className="text-lg font-black text-white">{r.totalPoints}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Ligues</h2>
        {[{ name: 'City Rivals', members: 28, status: 'OPEN' }, { name: 'Weekend Kings', members: 19, status: 'HOT' }].map((league) => (
          <article key={league.name} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-black">{league.name}</p>
              <span className="game-chip bg-white text-black">{league.status}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-300">{league.members} membres • Classement mis à jour en direct.</p>
            <button className="cta-primary mt-3 w-full">Voir la ligue</button>
          </article>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Challenges</h2>
        {campaigns.map((c) => (
          <article key={c.id} className="card border-brand p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Sponsor</p>
            <p className="mt-1 text-lg font-black">{c.name}</p>
            <p className="mt-1 text-sm text-zinc-300">{c.sponsorBrand} • Participation ouverte</p>
            <div className="mt-3 h-2 rounded-full bg-zinc-800">
              <div className="h-2 w-2/3 rounded-full bg-brand" />
            </div>
          </article>
        ))}
        {challenges.map((c) => (
          <article key={c.id} className="card p-4">
            <p className="text-sm font-black">{c.name}</p>
            <p className="text-xs text-zinc-300">Objectif: série de pronos + bonus points</p>
          </article>
        ))}
      </section>

      <PlayerNav />
    </main>
  );
}
