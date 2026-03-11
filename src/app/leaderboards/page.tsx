import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeaderboardsPage() {
  const rows = await prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 20 });
  const topPlayer = rows[0];

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-5">
      <header className="rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">Season Ranking</p>
        <h1 className="mt-1 text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-300">Compete weekly, maintain streaks, and secure top status.</p>
      </header>

      <AdSlotView code="LEADERBOARD_SPONSOR" />

      {topPlayer && (
        <section className="card border-emerald-200 bg-emerald-50">
          <p className="text-xs uppercase tracking-wide text-emerald-800">Current #1</p>
          <p className="mt-1 text-lg font-bold text-emerald-900">{topPlayer.displayName}</p>
          <p className="text-sm text-emerald-800">{topPlayer.totalPoints} pts • streak {topPlayer.currentStreak}</p>
        </section>
      )}

      <section className="card space-y-2">
        {rows.length === 0 && <p className="text-sm text-slate-600">No rankings yet. Predictions will populate this table.</p>}
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${i < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>#{i + 1}</span>
              <div>
                <p className="font-semibold">{r.displayName}</p>
                <p className="text-xs text-slate-500">Streak {r.currentStreak} • Trend +{Math.max(1, 4 - (i % 4))}</p>
              </div>
            </div>
            <p className="font-bold text-brand">{r.totalPoints} pts</p>
          </div>
        ))}
      </section>
      <PlayerNav />
    </main>
  );
}
