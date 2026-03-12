import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureChallengeFixtureLinks } from '@/lib/services/challenge-service';
import { formatMatchDateTime } from '@/lib/date-format';

async function updateChallenge(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const competitionIds = formData.getAll('competitionIds').map((v) => String(v)).filter(Boolean);
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  const reward = String(formData.get('reward') ?? '').trim();
  const isActive = String(formData.get('isActive') ?? '') === 'on';
  if (!id || !name || !competitionIds.length || !startDate || !endDate) return;

  await prisma.challenge.update({
    where: { id },
    data: {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || null,
      reward: reward || null,
      isActive,
    },
  });

  await prisma.challengeCompetition.deleteMany({ where: { challengeId: id } });
  await prisma.challengeCompetition.createMany({
    data: competitionIds.map((competitionId) => ({ challengeId: id, competitionId })),
    skipDuplicates: true,
  });

  await prisma.challengeFixture.deleteMany({ where: { challengeId: id } });
  await ensureChallengeFixtureLinks(id);

  revalidatePath(`/admin/challenges/${id}`);
  revalidatePath('/admin/challenges');
  revalidatePath('/challenges');
}

export default async function AdminChallengeDetailPage({ params }: { params: { id: string } }) {
  const [challenge, competitions] = await Promise.all([
    prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        competitions: { include: { competition: true } },
        fixtures: { include: { fixture: { include: { homeTeam: true, awayTeam: true, competition: true } } } },
      },
    }),
    prisma.competition.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
  ]);

  if (!challenge) notFound();
  const selectedCompetitionIds = new Set(challenge.competitions.map((item) => item.competitionId));

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Challenge: {challenge.name}</h1>
      <p><strong>Compétitions:</strong> {challenge.competitions.map((item) => item.competition.name).join(', ')}</p>
      <p><strong>Période:</strong> {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</p>
      <p><strong>Récompense:</strong> {challenge.reward ?? 'Aucune'}</p>

      <form action={updateChallenge} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="id" defaultValue={challenge.id} />
        <input name="name" defaultValue={challenge.name} className="rounded border p-2" required />
        <input name="slug" defaultValue={challenge.slug} className="rounded border p-2" />
        <select multiple name="competitionIds" className="rounded border p-2 md:col-span-2" defaultValue={Array.from(selectedCompetitionIds)} required>
          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>{competition.name}</option>
          ))}
        </select>
        <label className="rounded border p-2 text-sm">Début <input className="w-full" type="date" name="startDate" defaultValue={new Date(challenge.startDate).toISOString().slice(0, 10)} required /></label>
        <label className="rounded border p-2 text-sm">Fin <input className="w-full" type="date" name="endDate" defaultValue={new Date(challenge.endDate).toISOString().slice(0, 10)} required /></label>
        <input name="reward" defaultValue={challenge.reward ?? ''} className="rounded border p-2" placeholder="Récompense" />
        <textarea name="description" defaultValue={challenge.description ?? ''} className="rounded border p-2 md:col-span-2" />
        <label className="flex items-center gap-2 text-sm font-semibold"><input defaultChecked={challenge.isActive} name="isActive" type="checkbox" /> Actif</label>
        <button type="submit" className="rounded bg-brand px-3 py-2 font-bold text-black">Edit challenge</button>
      </form>

      <div className="rounded-2xl bg-white p-4">
        <h2 className="mb-2 text-xl font-bold">Matchs inclus</h2>
        <ul className="space-y-1 text-sm">
          {challenge.fixtures.map((row) => (
            <li key={row.id}>{row.fixture.competition.name} — {row.fixture.homeTeam.name} vs {row.fixture.awayTeam.name} ({formatMatchDateTime(row.fixture.utcKickoff)})</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
