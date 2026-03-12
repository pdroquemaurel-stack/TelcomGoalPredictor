import { revalidatePath } from 'next/cache';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function createMatch(formData: FormData) {
  'use server';
  const competitionId = String(formData.get('competitionId') ?? '');
  const home = String(formData.get('home') ?? '').trim();
  const away = String(formData.get('away') ?? '').trim();
  const kickoff = String(formData.get('kickoff') ?? '');
  if (!competitionId || !home || !away || !kickoff) return;

  const homeTeam = await prisma.team.upsert({
    where: { externalId: `manual-team-${home.toLowerCase().replace(/\s+/g, '-')}` },
    update: { name: home },
    create: { externalId: `manual-team-${home.toLowerCase().replace(/\s+/g, '-')}`, name: home },
  });
  const awayTeam = await prisma.team.upsert({
    where: { externalId: `manual-team-${away.toLowerCase().replace(/\s+/g, '-')}` },
    update: { name: away },
    create: { externalId: `manual-team-${away.toLowerCase().replace(/\s+/g, '-')}`, name: away },
  });

  await prisma.fixture.create({
    data: {
      externalId: `manual-fixture-${Date.now()}`,
      competitionId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      utcKickoff: new Date(kickoff),
      statusText: 'SCHEDULED',
      fixtureState: FixtureState.SCHEDULED,
      predictionEnabled: true,
      visible: true,
    },
  });

  revalidatePath('/admin/fixtures');
}

export default async function AdminFixturesPage() {
  const [fixtures, competitions] = await Promise.all([
    prisma.fixture.findMany({ include: { competition: true, homeTeam: true, awayTeam: true }, orderBy: { utcKickoff: 'asc' }, take: 80 }),
    prisma.competition.findMany({ where: { active: true }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Matches</h1>
      <form action={createMatch} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-5">
        <select className="rounded border p-2" name="competitionId" required>
          {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
        </select>
        <input className="rounded border p-2" name="home" placeholder="Home team" required />
        <input className="rounded border p-2" name="away" placeholder="Away team" required />
        <input className="rounded border p-2" type="datetime-local" name="kickoff" required />
        <button className="rounded bg-brand px-3 py-2 font-bold text-black" type="submit">Add match</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Competition</th><th>Match</th><th>Kickoff UTC</th><th>Status</th></tr></thead>
          <tbody>
            {fixtures.map((fixture) => (
              <tr key={fixture.id} className="border-t">
                <td className="py-2">{fixture.competition.name}</td>
                <td>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</td>
                <td>{fixture.utcKickoff.toISOString()}</td>
                <td>{fixture.fixtureState}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
