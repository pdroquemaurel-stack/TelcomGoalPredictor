import { AdSlotView } from '@/components/ad-slot';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export default async function LeaderboardsPage() {
  const rows = await prisma.profile.findMany({ orderBy: { totalPoints: 'desc' }, take: 20 });
  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <h1 className="text-xl font-bold">Leaderboards</h1>
      <AdSlotView code="LEADERBOARD_SPONSOR" />
      <div className="card mt-3">
        {rows.map((r, i) => <p key={r.id} className="text-sm">#{i + 1} {r.displayName} • {r.totalPoints} pts • streak {r.currentStreak}</p>)}
      </div>
      <PlayerNav />
    </main>
  );
}
