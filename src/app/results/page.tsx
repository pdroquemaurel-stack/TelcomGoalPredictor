import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function ResultsPage() {
  const fixtures = await prisma.fixture.findMany({ where: { homeScore: { not: null }, awayScore: { not: null } }, include: { homeTeam: true, awayTeam: true }, orderBy: { utcKickoff: 'desc' }, take: 20 });
  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold">Results & Scoring</h1>
      {fixtures.map((f) => (
        <div className="card" key={f.id}>
          <p>{f.homeTeam.name} {f.homeScore} - {f.awayScore} {f.awayTeam.name}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
      ))}
      <PlayerNav />
    </main>
  );
}
