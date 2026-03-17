import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { CompetitionType, FixtureState } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function createCompetition(formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? CompetitionType.CLUB) as CompetitionType;
  const externalId = `manual-${Date.now()}`;
  if (!name) return;

  await prisma.competition.create({
    data: {
      name,
      code: code || null,
      type,
      externalId,
      displayOrder: code === 'WC2026' ? 0 : 10,
    },
  });
  revalidatePath('/admin/competitions');
}

async function toggleCompetition(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';
  if (!id) return;
  await prisma.competition.update({ where: { id }, data: { active: !active } });
  revalidatePath('/admin/competitions');
  revalidatePath('/predictions');
  revalidatePath('/');
}

export default async function Page() {
  const [comps, finishedByCompetition] = await Promise.all([
    prisma.competition.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { fixtures: true } } },
    }),
    prisma.fixture.groupBy({
      by: ['competitionId'],
      where: { fixtureState: { in: [FixtureState.FINISHED, FixtureState.SETTLED] } },
      _count: { _all: true },
    }),
  ]);

  const finishedMap = new Map(finishedByCompetition.map((row) => [row.competitionId, row._count._all]));

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Competitions</h1>
      <form action={createCompetition} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-4">
        <input className="rounded border p-2" name="name" placeholder="Competition name" required />
        <input className="rounded border p-2" name="code" placeholder="Code (ex: WC2026)" />
        <select className="rounded border p-2" defaultValue={CompetitionType.CLUB} name="type">
          <option value={CompetitionType.NATIONAL}>National</option>
          <option value={CompetitionType.CLUB}>Club</option>
        </select>
        <button className="rounded bg-brand px-3 py-2 font-bold text-black" type="submit">Create competition</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left"><th>Name</th><th>Type</th><th>Status</th><th>Matches</th><th>Action</th></tr>
          </thead>
          <tbody>
            {comps.map((competition) => {
              const targetUrl = `/admin/fixtures?competitionId=${competition.id}`;
              const finished = finishedMap.get(competition.id) ?? 0;
              return (
                <tr key={competition.id} className="border-t transition hover:bg-zinc-50">
                  <td className="py-2">
                    <Link className="block w-full font-semibold text-zinc-900 underline-offset-2 hover:underline" href={targetUrl}>
                      {competition.name}
                    </Link>
                  </td>
                  <td>
                    <Link className="block w-full" href={targetUrl}>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${competition.type === CompetitionType.NATIONAL ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {competition.type === CompetitionType.NATIONAL ? 'National' : 'Club'}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link className="block w-full" href={targetUrl}>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${competition.active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-700'}`}>
                        {competition.active ? 'Active' : 'Inactive'}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link className="block w-full" href={targetUrl}>{finished} / {competition._count.fixtures}</Link>
                  </td>
                  <td>
                    <form action={toggleCompetition}>
                      <input type="hidden" name="id" value={competition.id} />
                      <input type="hidden" name="active" value={String(competition.active)} />
                      <button
                        aria-label={`Toggle competition ${competition.name}`}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition ${competition.active ? 'bg-green-500' : 'bg-zinc-300'}`}
                        type="submit"
                      >
                        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${competition.active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
