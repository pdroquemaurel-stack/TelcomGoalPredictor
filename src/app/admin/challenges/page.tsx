import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureChallengeFixtureLinks } from '@/lib/services/challenge-service';

export const dynamic = 'force-dynamic';

async function upsertChallenge(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const competitionId = String(formData.get('competitionId') ?? '');
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  const reward = String(formData.get('reward') ?? '').trim();
  const isActive = String(formData.get('isActive') ?? '') === 'on';
  if (!name || !competitionId || !startDate || !endDate) return;

  const payload = {
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    competitionId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    description: description || null,
    reward: reward || null,
    isActive,
  };

  const challenge = id
    ? await prisma.challenge.update({ where: { id }, data: payload })
    : await prisma.challenge.create({ data: payload });

  await prisma.challengeFixture.deleteMany({ where: { challengeId: challenge.id } });
  await ensureChallengeFixtureLinks(challenge.id);
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');
  revalidatePath('/');
}

async function deleteChallenge(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await prisma.challenge.delete({ where: { id } });
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');
}

export default async function AdminChallengesPage() {
  const [competitions, challenges] = await Promise.all([
    prisma.competition.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.challenge.findMany({ include: { competition: true, _count: { select: { fixtures: true } } }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Challenges</h1>
      <form action={upsertChallenge} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-2">
        <input name="name" className="rounded border p-2" placeholder="Nom" required />
        <input name="slug" className="rounded border p-2" placeholder="Slug (optionnel)" />
        <select name="competitionId" className="rounded border p-2" required>
          <option value="">Compétition</option>
          {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
        </select>
        <label className="rounded border p-2 text-sm">Début <input className="w-full" type="date" name="startDate" required /></label>
        <label className="rounded border p-2 text-sm">Fin <input className="w-full" type="date" name="endDate" required /></label>
        <input name="reward" className="rounded border p-2" placeholder="Lot / récompense (optionnel)" />
        <textarea name="description" className="rounded border p-2 md:col-span-2" placeholder="Description (optionnel)" />
        <label className="flex items-center gap-2 text-sm font-semibold"><input defaultChecked name="isActive" type="checkbox" /> Actif</label>
        <button type="submit" className="rounded bg-brand px-3 py-2 font-bold text-black">Créer le challenge</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Nom</th><th>Compétition</th><th>Période</th><th>Statut</th><th>Matchs</th><th>Action</th></tr></thead>
          <tbody>
            {challenges.map((challenge) => (
              <tr key={challenge.id} className="border-t">
                <td className="py-2 font-semibold">{challenge.name}</td>
                <td>{challenge.competition.name}</td>
                <td>{new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</td>
                <td>{challenge.isActive ? 'Actif' : 'Inactif'}</td>
                <td>{challenge._count.fixtures}</td>
                <td>
                  <form action={deleteChallenge}>
                    <input type="hidden" name="id" value={challenge.id} />
                    <button type="submit" className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white">Supprimer</button>
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
