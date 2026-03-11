import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function AdminFixturesPage() {
  const fixtures = await prisma.fixture.findMany({ include: { competition: true, homeTeam: true, awayTeam: true }, orderBy: { utcKickoff: 'asc' }, take: 50 });
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Fixture Management</h1>
      <form action="/api/admin/sync" method="post"><button className="mb-3 rounded bg-brand px-3 py-2 text-white">Sync fixtures from API</button></form>
      <div className="card overflow-auto">
        <table className="w-full text-sm"><thead><tr><th>Competition</th><th>Match</th><th>Kickoff UTC</th><th>State</th></tr></thead><tbody>
          {fixtures.map(f => <tr key={f.id}><td>{f.competition.name}</td><td>{f.homeTeam.name} vs {f.awayTeam.name}</td><td>{f.utcKickoff.toISOString()}</td><td>{f.fixtureState}</td></tr>)}
        </tbody></table>
      </div>
    </div>
  );
}
