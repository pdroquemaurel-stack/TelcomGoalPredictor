import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function createCompetition(formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const externalId = `manual-${Date.now()}`;
  if (!name) return;

  await prisma.competition.create({
    data: { name, code: code || null, externalId, displayOrder: code === 'WC2026' ? 0 : 10 },
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
}

export default async function Page() {
  const comps = await prisma.competition.findMany({
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { fixtures: true } } },
  });

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Competitions</h1>
      <form action={createCompetition} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-3">
        <input className="rounded border p-2" name="name" placeholder="Competition name" required />
        <input className="rounded border p-2" name="code" placeholder="Code (ex: WC2026)" />
        <button className="rounded bg-brand px-3 py-2 font-bold text-black" type="submit">Create competition</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left"><th>Name</th><th>Type</th><th>Status</th><th>Matches</th><th>Action</th></tr>
          </thead>
          <tbody>
            {comps.map((competition) => (
              <tr key={competition.id} className="border-t">
                <td className="py-2 font-semibold">{competition.name}</td>
                <td>{competition.code === 'WC2026' ? 'World Cup featured' : competition.code ?? 'General'}</td>
                <td>{competition.active ? 'Active' : 'Archived'}</td>
                <td>{competition._count.fixtures}</td>
                <td>
                  <form action={toggleCompetition}>
                    <input type="hidden" name="id" value={competition.id} />
                    <input type="hidden" name="active" value={String(competition.active)} />
                    <button className="rounded border px-2 py-1" type="submit">{competition.active ? 'Archive' : 'Activate'}</button>
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
