import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminDateTimePicker } from '@/components/admin-datetime-picker';
import { settleFixturesByIds } from '@/lib/services/settlement-service';

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
  revalidatePath('/predictions');
}

async function updateFixture(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const kickoff = String(formData.get('kickoff') ?? '');
  const fixtureState = String(formData.get('fixtureState') ?? FixtureState.SCHEDULED) as FixtureState;
  const visible = String(formData.get('visible') ?? 'true') === 'true';
  const predictionEnabled = String(formData.get('predictionEnabled') ?? 'true') === 'true';
  const homeScoreRaw = String(formData.get('homeScore') ?? '').trim();
  const awayScoreRaw = String(formData.get('awayScore') ?? '').trim();

  await prisma.fixture.update({
    where: { id },
    data: {
      utcKickoff: kickoff ? new Date(kickoff) : undefined,
      fixtureState,
      statusText: fixtureState,
      visible,
      predictionEnabled,
      homeScore: homeScoreRaw === '' ? null : Number(homeScoreRaw),
      awayScore: awayScoreRaw === '' ? null : Number(awayScoreRaw),
    },
  });

  await prisma.auditLog.create({
    data: { action: 'ADMIN_FIXTURE_UPDATE', targetType: 'FIXTURE', targetId: id, metadata: { fixtureState, visible, predictionEnabled } },
  });

  revalidatePath('/admin/fixtures');
  revalidatePath('/predictions');
}

async function settleFixture(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await settleFixturesByIds([id]);
  await prisma.auditLog.create({ data: { action: 'ADMIN_FIXTURE_SETTLE', targetType: 'FIXTURE', targetId: id } });

  revalidatePath('/admin/fixtures');
  revalidatePath('/predictions');
  revalidatePath('/results');
}

export default async function AdminFixturesPage({ searchParams }: { searchParams?: { competitionId?: string | string[]; q?: string | string[]; state?: string | string[]; day?: string | string[] } }) {
  const competitionId = Array.isArray(searchParams?.competitionId) ? searchParams?.competitionId[0] : searchParams?.competitionId;
  const query = (Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q) ?? '';
  const selectedState = (Array.isArray(searchParams?.state) ? searchParams?.state[0] : searchParams?.state) ?? '';
  const day = (Array.isArray(searchParams?.day) ? searchParams?.day[0] : searchParams?.day) ?? '';

  const dayStart = day ? new Date(`${day}T00:00:00.000Z`) : null;
  const dayEnd = day ? new Date(`${day}T23:59:59.999Z`) : null;

  const [fixtures, competitions] = await Promise.all([
    prisma.fixture.findMany({
      where: {
        ...(competitionId ? { competitionId } : {}),
        ...(selectedState ? { fixtureState: selectedState as FixtureState } : {}),
        ...(query
          ? {
            OR: [
              { homeTeam: { name: { contains: query, mode: 'insensitive' } } },
              { awayTeam: { name: { contains: query, mode: 'insensitive' } } },
              { competition: { name: { contains: query, mode: 'insensitive' } } },
            ],
          }
          : {}),
        ...(dayStart && dayEnd ? { utcKickoff: { gte: dayStart, lte: dayEnd } } : {}),
      },
      include: { competition: true, homeTeam: true, awayTeam: true, predictions: { select: { id: true } } },
      orderBy: { utcKickoff: 'asc' },
      take: 120,
    }),
    prisma.competition.findMany({ orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  return (
    <div className="space-y-4 text-black">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matches</h1>
        <Link className="rounded border border-zinc-300 px-3 py-2 text-sm font-semibold" href="/admin/competitions">← Back to competitions</Link>
      </div>

      <form className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-5" method="GET">
        <input name="q" defaultValue={query} className="rounded border p-2" placeholder="Recherche équipe/compétition" />
        <select className="rounded border p-2" defaultValue={competitionId} name="competitionId"><option value="">Toutes compétitions</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select>
        <select className="rounded border p-2" defaultValue={selectedState} name="state"><option value="">Tous statuts</option>{Object.values(FixtureState).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <input type="date" className="rounded border p-2" name="day" defaultValue={day} />
        <button className="rounded border px-3 py-2 font-semibold" type="submit">Filtrer</button>
      </form>

      <form action={createMatch} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-5">
        <select className="rounded border p-2" defaultValue={competitionId} name="competitionId" required>
          {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
        </select>
        <input className="rounded border p-2" name="home" placeholder="Home team" required />
        <input className="rounded border p-2" name="away" placeholder="Away team" required />
        <AdminDateTimePicker name="kickoff" required />
        <button className="rounded bg-brand px-3 py-2 font-bold text-black" type="submit">Add match</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Match</th><th>Kickoff UTC</th><th>Status</th><th>Flags</th><th>Score</th><th>Actions</th></tr></thead>
          <tbody>
            {fixtures.map((fixture) => (
              <tr key={fixture.id} className="border-t align-top">
                <td className="py-2"><p className="font-semibold">{fixture.homeTeam.name} vs {fixture.awayTeam.name}</p><p className="text-xs text-zinc-500">{fixture.competition.name} • {fixture.predictions.length} pronos</p></td>
                <td>{fixture.utcKickoff.toISOString()}</td>
                <td>{fixture.fixtureState}</td>
                <td>visible={String(fixture.visible)}<br />locked={String(!fixture.predictionEnabled)}</td>
                <td>{fixture.homeScore ?? '-'} - {fixture.awayScore ?? '-'}</td>
                <td>
                  <form action={updateFixture} className="space-y-1">
                    <input type="hidden" name="id" value={fixture.id} />
                    <input type="datetime-local" name="kickoff" className="rounded border p-1" defaultValue={fixture.utcKickoff.toISOString().slice(0, 16)} />
                    <div className="flex gap-1">
                      <input name="homeScore" className="w-16 rounded border p-1" defaultValue={fixture.homeScore ?? ''} placeholder="H" />
                      <input name="awayScore" className="w-16 rounded border p-1" defaultValue={fixture.awayScore ?? ''} placeholder="A" />
                    </div>
                    <select name="fixtureState" className="rounded border p-1" defaultValue={fixture.fixtureState}>{Object.values(FixtureState).map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <select name="visible" className="rounded border p-1" defaultValue={fixture.visible ? 'true' : 'false'}><option value="true">Visible</option><option value="false">Masqué</option></select>
                    <select name="predictionEnabled" className="rounded border p-1" defaultValue={fixture.predictionEnabled ? 'true' : 'false'}><option value="true">Déverrouillé</option><option value="false">Verrouillé</option></select>
                    <button className="rounded border px-2 py-1 text-xs font-semibold" type="submit">Enregistrer</button>
                  </form>
                  <form action={settleFixture}>
                    <input type="hidden" name="id" value={fixture.id} />
                    <button className="mt-1 rounded bg-black px-2 py-1 text-xs font-semibold text-white" type="submit">Relancer settlement</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
