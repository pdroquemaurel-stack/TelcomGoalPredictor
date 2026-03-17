import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getActiveChallengesFilter } from '@/lib/services/challenge-service';
import { PlayerNav } from '@/components/player-nav';
import { requireOnboardedUser } from '@/lib/player-access';
import { getChallengeLeaderboard } from '@/lib/services/challenge-service';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
  const { me } = await requireOnboardedUser();
  const challenges = await prisma.challenge.findMany({
    where: getActiveChallengesFilter(),
    include: {
      competitions: { include: { competition: true } },
      _count: { select: { fixtures: true } },
      fixtures: {
        include: {
          fixture: {
            include: {
              predictions: { where: { userId: me.id }, take: 1 },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const sortedChallenges = [...challenges].sort((a, b) => {
    const aActive = a.startDate <= now && a.endDate >= now;
    const bActive = b.startDate <= now && b.endDate >= now;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return +new Date(a.startDate) - +new Date(b.startDate);
  });

  const challengeIds = sortedChallenges.map((challenge) => challenge.id);
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

  const myRanks = new Map<string, number>();
  for (const challenge of sortedChallenges.filter((item) => item.challengeType === 'RANKING')) {
    const leaderboard = await getChallengeLeaderboard(challenge.id);
    const row = leaderboard.find((entry) => entry.userId === me.id);
    if (row) myRanks.set(challenge.id, row.rank);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Challenges</p>
        <h1 className="mt-1 text-2xl font-black">Challenges actifs</h1>
      </header>
      {sortedChallenges.map((challenge) => {
        const daysToStart = Math.ceil((+new Date(challenge.startDate) - +now) / (1000 * 60 * 60 * 24));
        const isLive = challenge.startDate <= now && challenge.endDate >= now;
        const participantCount = participantMap.get(challenge.id)?.size ?? 0;
        const myRank = myRanks.get(challenge.id);
        const completionHits = challenge.fixtures.filter((entry) => {
          const pred = entry.fixture.predictions[0];
          if (!pred || entry.fixture.homeScore === null || entry.fixture.awayScore === null) return false;
          const predictedDiff = pred.homeScore - pred.awayScore;
          const finalDiff = entry.fixture.homeScore - entry.fixture.awayScore;
          const correct = (predictedDiff === 0 && finalDiff === 0) || (predictedDiff > 0 && finalDiff > 0) || (predictedDiff < 0 && finalDiff < 0);
          const exact = pred.homeScore === entry.fixture.homeScore && pred.awayScore === entry.fixture.awayScore;
          return challenge.completionMode === 'EXACT' ? exact : correct;
        }).length;
        const completionDone = challenge.challengeType === 'COMPLETION' && (challenge.completionTarget ?? 0) > 0 && completionHits >= (challenge.completionTarget ?? 0);
        return (
          <article key={challenge.id} className="card relative">
            <span className="absolute right-4 top-4 rounded-full bg-zinc-900 px-3 py-1 text-sm font-black text-brand">{participantCount} 👥</span>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">{challenge.competitions.map((item) => item.competition.name).join(' • ') || 'Multi-compétitions'}</p>
            <h2 className="text-xl font-black">{challenge.name} {myRank ? <span className="text-sm text-brand">• Rang #{myRank}</span> : null} {completionDone ? <span>✅</span> : null}</h2>
            {challenge.description && <p className="mt-1 text-sm text-zinc-200">{challenge.description}</p>}
            <p className="mt-1 text-xs text-zinc-300">{new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()} • {challenge._count.fixtures} matchs</p>
            {challenge.reward && <p className="mt-1 text-sm font-bold text-brand">🏆 {challenge.reward}</p>}

            {daysToStart > 0 ? (
              <button type="button" disabled className="mt-3 w-full cursor-not-allowed rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm font-black text-zinc-400">Commence dans {daysToStart} jours</button>
            ) : isLive ? (
              <Link href={`/challenges/${challenge.slug}`} className="cta-primary mt-3 inline-block w-full text-center">S’inscrire au challenge</Link>
            ) : (
              <Link href={`/challenges/${challenge.slug}`} className="cta-primary mt-3 inline-block w-full text-center">Voir le challenge</Link>
            )}
          </article>
        );
      })}
      {sortedChallenges.length === 0 && <article className="card text-sm text-zinc-300">Aucun challenge actif.</article>}
      <PlayerNav />
    </main>
  );
}
