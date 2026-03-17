import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AdminDateTimePicker } from '@/components/admin-datetime-picker';
import { settleFixturesByIds } from '@/lib/services/settlement-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function longDate(value: Date) {
  return value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function rowTone(state: FixtureState) {
  if (state === FixtureState.SETTLED || state === FixtureState.FINISHED) return 'bg-emerald-50/70';
  if (state === FixtureState.LIVE) return 'bg-amber-50/70';
  return 'bg-sky-50/60';
}

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

  await settleFixturesByIds([id]);

  await prisma.auditLog.create({
    data: { action: 'ADMIN_FIXTURE_UPDATE', targetType: 'FIXTURE', targetId: id, metadata: { fixtureState, visible, predictionEnabled } },
  });

  revalidatePath('/admin/fixtures');
  revalidatePath('/predictions');
  revalidatePath('/results');
}

export default async function AdminFixturesPage({ searchParams }: { searchParams?: { competitionId?: string | string[]; q?: string | string[]; state?: string | string[]; day?: string | string[]; sort?: string | string[]; edit?: string | string[]; add?: string | string[] } }) {
  const competitionId = Array.isArray(searchParams?.competitionId) ? searchParams?.competitionId[0] : searchParams?.competitionId;
  const query = (Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q) ?? '';
  const selectedState = (Array.isArray(searchParams?.state) ? searchParams?.state[0] : searchParams?.state) ?? '';
  const day = (Array.isArray(searchParams?.day) ? searchParams?.day[0] : searchParams?.day) ?? '';
  const sort = (Array.isArray(searchParams?.sort) ? searchParams?.sort[0] : searchParams?.sort) ?? 'date';
  const editId = (Array.isArray(searchParams?.edit) ? searchParams?.edit[0] : searchParams?.edit) ?? '';
  const add = (Array.isArray(searchParams?.add) ? searchParams?.add[0] : searchParams?.add) ?? '';

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
      include: { competition: true, homeTeam: true, awayTeam: true, _count: { select: { predictions: true } } },
      orderBy: [{ utcKickoff: 'asc' }],
      take: 120,
    }),
    prisma.competition.findMany({ orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
  ]);

  const sortedFixtures = [...fixtures].sort((a, b) => {
    if (sort === 'predictions') return b._count.predictions - a._count.predictions;
    return +new Date(a.utcKickoff) - +new Date(b.utcKickoff);
  });

  return (
    <div className="space-y-4 text-black">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matches</h1>
        <div className="flex items-center gap-2">
          <Link className="rounded border border-zinc-300 px-3 py-2 text-sm font-semibold" href="/admin/competitions">← Back to competitions</Link>
          <Link className="rounded bg-brand px-3 py-2 text-sm font-bold text-black" href="/admin/fixtures?add=1">Add match</Link>
        </div>
      </div>

      {add === '1' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <form action={createMatch} className="grid w-full max-w-2xl gap-2 rounded-2xl bg-white p-4 md:grid-cols-5">
            <div className="md:col-span-5 flex items-center justify-between"><h2 className="text-lg font-bold">Créer un match</h2><Link className="text-sm font-semibold" href="/admin/fixtures">Fermer</Link></div>
            <select className="rounded border p-2" defaultValue={competitionId} name="competitionId" required>
              {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
            </select>
            <input className="rounded border p-2" name="home" placeholder="Home team" required />
            <input className="rounded border p-2" name="away" placeholder="Away team" required />
            <AdminDateTimePicker name="kickoff" required />
            <button className="rounded bg-brand px-3 py-2 font-bold text-black" type="submit">Add match</button>
          </form>
        </div>
      )}

      <form className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-6" method="GET">
        <input name="q" defaultValue={query} className="rounded border p-2" placeholder="Recherche équipe/compétition" />
        <select className="rounded border p-2" defaultValue={competitionId} name="competitionId"><option value="">Toutes compétitions</option>{competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select>
        <select className="rounded border p-2" defaultValue={selectedState} name="state"><option value="">Tous statuts</option>{Object.values(FixtureState).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <input type="date" className="rounded border p-2" name="day" defaultValue={day} />
        <select className="rounded border p-2" defaultValue={sort} name="sort"><option value="date">Tri date</option><option value="predictions">Tri pronostics</option></select>
        <button className="rounded border px-3 py-2 font-semibold" type="submit">Filtrer</button>
      </form>

      <div className="space-y-2">
        {sortedFixtures.map((fixture) => {
          const isEditing = editId === fixture.id;
          return (
            <article key={fixture.id} className={`rounded-2xl border border-slate-200 p-3 ${rowTone(fixture.fixtureState)}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{fixture.homeTeam.name} vs {fixture.awayTeam.name}</p>
                  <p className="text-xs text-zinc-600">{fixture.competition.name} • {longDate(fixture.utcKickoff)}</p>
                  <p className="text-xs text-zinc-700">Statut: <strong>{fixture.fixtureState}</strong> • Score: <strong>{fixture.homeScore ?? '-'} - {fixture.awayScore ?? '-'}</strong></p>
                  <p className="text-xs text-zinc-700">Pronostics: <strong>{fixture._count.predictions}</strong> • {fixture.predictionEnabled ? '🔓' : '🔒'}</p>
                </div>
                <Link href={`/admin/fixtures?${new URLSearchParams({ ...(competitionId ? { competitionId } : {}), ...(query ? { q: query } : {}), ...(selectedState ? { state: selectedState } : {}), ...(day ? { day } : {}), sort, ...(isEditing ? {} : { edit: fixture.id }) }).toString()}`} className="rounded border px-3 py-1 text-sm font-semibold">Modifier</Link>
              </div>

              {isEditing && (
                <form action={updateFixture} className="mt-3 grid gap-2 rounded-xl bg-white/90 p-3 md:grid-cols-6">
                  <input type="hidden" name="id" value={fixture.id} />
                  <input type="datetime-local" name="kickoff" className="rounded border p-2 md:col-span-2" defaultValue={fixture.utcKickoff.toISOString().slice(0, 16)} />
                  <input name="homeScore" className="rounded border p-2" defaultValue={fixture.homeScore ?? ''} placeholder="Score domicile" />
                  <input name="awayScore" className="rounded border p-2" defaultValue={fixture.awayScore ?? ''} placeholder="Score extérieur" />
                  <select name="fixtureState" className="rounded border p-2" defaultValue={fixture.fixtureState}>{Object.values(FixtureState).map((value) => <option key={value} value={value}>{value}</option>)}</select>
                  <select name="predictionEnabled" className="rounded border p-2" defaultValue={fixture.predictionEnabled ? 'true' : 'false'}><option value="true">Déverrouillé</option><option value="false">Verrouillé</option></select>
                  <select name="visible" className="rounded border p-2" defaultValue={fixture.visible ? 'true' : 'false'}><option value="true">Visible</option><option value="false">Masqué</option></select>
                  <button className="rounded bg-black px-3 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">Save</button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
