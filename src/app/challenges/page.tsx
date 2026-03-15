import { requireOnboardedUser } from '@/lib/player-access';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { PlayerNav } from '@/components/player-nav';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
  await requireOnboardedUser();
  const challenges = await prisma.challenge.findMany({
    where: getActiveChallengesFilter(),
    include: { competitions: { include: { competition: true } }, _count: { select: { fixtures: true } } },
    orderBy: [{ startDate: 'asc' }],
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Challenges</p>
        <h1 className="mt-1 text-2xl font-black">Challenges actifs</h1>
      </header>
      {challenges.map((challenge) => (
        <article key={challenge.id} className="card">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{challenge.competitions.map((item) => item.competition.name).join(' • ') || 'Multi-compétitions'}</p>
          <h2 className="text-xl font-black">{challenge.name}</h2>
          {challenge.description && <p className="mt-1 text-sm text-zinc-200">{challenge.description}</p>}
          <p className="mt-1 text-xs text-zinc-300">{new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()} • {challenge._count.fixtures} matchs</p>
          {challenge.reward && <p className="mt-1 text-sm font-bold text-brand">🏆 {challenge.reward}</p>}
          <Link href={`/challenges/${challenge.slug}`} className="cta-primary mt-3 inline-block w-full text-center">Voir le challenge</Link>
        </article>
      ))}
      {challenges.length === 0 && <article className="card text-sm text-zinc-300">Aucun challenge actif.</article>}
      <PlayerNav />
    </main>
  );
}
