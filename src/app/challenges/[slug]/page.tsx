import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getChallengeDetailBySlug, getChallengeLeaderboard } from '@/lib/services/challenge-service';
import { PlayerNav } from '@/components/player-nav';

export const dynamic = 'force-dynamic';

export default async function ChallengeDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id ?? '';

  const challenge = await getChallengeDetailBySlug(params.slug, userId);
  if (!challenge) notFound();

  const leaderboard = await getChallengeLeaderboard(challenge.id);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Challenge</p>
        <h1 className="mt-1 text-2xl font-black">{challenge.name}</h1>
        <p className="mt-1 text-sm font-semibold">{challenge.competition.name} • {new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()}</p>
        {challenge.reward && <p className="mt-1 text-sm font-bold">🏆 {challenge.reward}</p>}
      </header>

      {challenge.description && <section className="card text-sm text-zinc-200">{challenge.description}</section>}

      <section className="card">
        <h2 className="section-title">Matchs du challenge</h2>
        <div className="mt-2 space-y-2">
          {challenge.fixtures.map((fixture) => (
            <article key={fixture.id} className="rounded-2xl border border-white/15 bg-black p-3">
              <p className="text-xs text-zinc-400">{new Date(fixture.kickoff).toLocaleString()}</p>
              <p className="font-bold">{fixture.home} vs {fixture.away}</p>
              <p className="text-xs font-semibold text-brand">{fixture.savedPrediction ? `Prono: ${fixture.savedPrediction.homeScore}-${fixture.savedPrediction.awayScore}` : 'Pas encore pronostiqué'}</p>
              <Link href={`/predictions?competitionId=${challenge.competition.id}`} className="mt-2 inline-block text-xs font-black uppercase text-brand">Pronostiquer</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Classement challenge</h2>
        <div className="mt-2 space-y-2">
          {leaderboard.slice(0, 10).map((row) => (
            <div key={row.userId} className="flex items-center justify-between rounded-xl bg-black px-3 py-2 text-sm">
              <p><strong>#{row.rank}</strong> {row.displayName}</p>
              <p className="font-black text-brand">{row.points} pts</p>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="text-sm text-zinc-300">Classement disponible après les premiers résultats.</p>}
        </div>
      </section>

      <PlayerNav />
    </main>
  );
}
