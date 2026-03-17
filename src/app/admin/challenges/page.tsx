import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureChallengeFixtureLinks } from '@/lib/services/challenge-service';
import { ChallengeTypeFields } from '@/components/challenge-type-fields';

export const dynamic = 'force-dynamic';

async function upsertChallenge(formData: FormData) {
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
  const challengeType = String(formData.get('challengeType') ?? 'RANKING') as 'RANKING' | 'COMPLETION';
  const completionMode = String(formData.get('completionMode') ?? '') as 'CORRECT' | 'EXACT';
  const completionTarget = Number(formData.get('completionTarget') ?? 0);
  if (!name || !competitionIds.length || !startDate || !endDate) return;

  const payload = {
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    description: description || null,
    reward: reward || null,
    isActive,
    challengeType,
    completionMode: challengeType === 'COMPLETION' ? completionMode || 'CORRECT' : null,
    completionTarget: challengeType === 'COMPLETION' && completionTarget > 0 ? completionTarget : null,
  };

  const challenge = id
    ? await prisma.challenge.update({ where: { id }, data: payload })
    : await prisma.challenge.create({ data: payload });

  await prisma.challengeCompetition.deleteMany({ where: { challengeId: challenge.id } });
  await prisma.challengeCompetition.createMany({
    data: competitionIds.map((competitionId) => ({ challengeId: challenge.id, competitionId })),
    skipDuplicates: true,
  });

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
  const [competitions, rawChallenges] = await Promise.all([
    prisma.competition.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    prisma.challenge.findMany({ include: { competitions: { include: { competition: true } }, _count: { select: { fixtures: true } } } }),
  ]);

  const challengeIds = rawChallenges.map((challenge) => challenge.id);
  const participantsRows = challengeIds.length
    ? await prisma.prediction.findMany({
      where: { fixture: { challengeFixtures: { some: { challengeId: { in: challengeIds } } } } },
      select: { userId: true, fixture: { select: { challengeFixtures: { select: { challengeId: true } } } } },
      take: 10000,
    })
    : [];

  const participantMap = new Map<string, Set<string>>();
  for (const row of participantsRows) {
    for (const link of row.fixture.challengeFixtures) {
      if (!participantMap.has(link.challengeId)) participantMap.set(link.challengeId, new Set());
      participantMap.get(link.challengeId)?.add(row.userId);
    }
  }

  const now = new Date();
  const challenges = [...rawChallenges].sort((a, b) => {
    const aActive = a.startDate <= now && a.endDate >= now;
    const bActive = b.startDate <= now && b.endDate >= now;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return +new Date(a.startDate) - +new Date(b.startDate);
  });

  return (
    <div className="space-y-4 text-black">
      <h1 className="text-2xl font-bold">Challenges</h1>
      <form action={upsertChallenge} className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-2">
        <input name="name" className="rounded border p-2" placeholder="Nom" required />
        <input name="slug" className="rounded border p-2" placeholder="Slug (optionnel)" />
        <div className="rounded border p-2 md:col-span-2">
          <p className="mb-2 text-sm font-semibold">Compétitions</p>
          <div className="flex flex-wrap gap-2">
            {competitions.map((competition) => (
              <label key={competition.id} className="cursor-pointer rounded-full border px-3 py-1 text-sm has-[:checked]:border-orange-400 has-[:checked]:text-orange-500">
                <input className="sr-only" name="competitionIds" type="checkbox" value={competition.id} />
                {competition.name}
              </label>
            ))}
          </div>
        </div>
        <label className="rounded border p-2 text-sm">Début <input className="w-full" type="date" name="startDate" required /></label>
        <label className="rounded border p-2 text-sm">Fin <input className="w-full" type="date" name="endDate" required /></label>
        <ChallengeTypeFields challengeType={'RANKING'} completionMode={'CORRECT'} completionTarget={null} />
        <input name="reward" className="rounded border p-2" placeholder="Lot / récompense (optionnel)" />
        <textarea name="description" className="rounded border p-2 md:col-span-2" placeholder="Description (optionnel)" />
        <label className="flex items-center gap-2 text-sm font-semibold"><input defaultChecked name="isActive" type="checkbox" /> Actif</label>
        <button type="submit" className="rounded bg-brand px-3 py-2 font-bold text-black">Créer le challenge</button>
      </form>

      <div className="overflow-auto rounded-2xl bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Nom</th><th>Compétitions</th><th>Période</th><th>Statut</th><th>Matchs</th><th>Participants</th><th>Action</th></tr></thead>
          <tbody>
            {challenges.map((challenge) => {
              const isLive = challenge.isActive && challenge.startDate <= now && challenge.endDate >= now;
              return (
                <tr key={challenge.id} className={`border-t ${isLive ? 'bg-emerald-100/50' : ''}`}>
                  <td className="py-2 font-semibold">{challenge.name}</td>
                  <td>{challenge.competitions.map((item) => item.competition.name).join(', ')}</td>
                  <td>{new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</td>
                  <td>{challenge.isActive ? 'Actif' : 'Inactif'}</td>
                  <td>{challenge._count.fixtures}</td>
                  <td>{participantMap.get(challenge.id)?.size ?? 0}</td>
                  <td className="space-x-2">
                    <Link className="rounded bg-black px-2 py-1 text-xs font-bold text-white" href={`/admin/challenges/${challenge.id}`}>Détail</Link>
                    <form action={deleteChallenge} className="inline">
                      <input type="hidden" name="id" value={challenge.id} />
                      <button type="submit" className="rounded bg-rose-600 px-2 py-1 text-xs font-bold text-white">Supprimer</button>
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
