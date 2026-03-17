import { notFound } from 'next/navigation';
import { ChallengeCompletionMode, ChallengeType } from '@prisma/client';
import { getChallengeDetailBySlug, getChallengeLeaderboard } from '@/lib/services/challenge-service';
import { PlayerNav } from '@/components/player-nav';
import { ChallengeFixturesClient } from '@/app/challenges/[slug]/challenge-fixtures-client';
import { requireAuthenticatedUser } from '@/lib/session-user';

export const dynamic = 'force-dynamic';

export default async function ChallengeDetailPage({ params }: { params: { slug: string } }) {
  const me = await requireAuthenticatedUser();

  const challenge = await getChallengeDetailBySlug(params.slug, me.id);
  if (!challenge) notFound();

  const leaderboard = await getChallengeLeaderboard(challenge.id);
  const myRank = leaderboard.find((row) => row.userId === me.id)?.rank;

  const completionTarget = challenge.completionTarget ?? 0;
  const completionHits = challenge.fixtures.filter((fixture) => {
    if (!fixture.savedPrediction || !fixture.finalScore) return false;
    const predictedDiff = fixture.savedPrediction.homeScore - fixture.savedPrediction.awayScore;
    const finalDiff = fixture.finalScore.homeScore - fixture.finalScore.awayScore;
    const correct = (predictedDiff === 0 && finalDiff === 0) || (predictedDiff > 0 && finalDiff > 0) || (predictedDiff < 0 && finalDiff < 0);
    const exact = fixture.savedPrediction.homeScore === fixture.finalScore.homeScore && fixture.savedPrediction.awayScore === fixture.finalScore.awayScore;
    if (challenge.completionMode === ChallengeCompletionMode.EXACT) return exact;
    return correct;
  }).length;
  const isCompleted = completionTarget > 0 && completionHits >= completionTarget;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Challenge</p>
        <h1 className="mt-1 text-2xl font-black">{challenge.name}</h1>
        <p className="mt-1 text-sm font-semibold">{challenge.competitions.join(' • ')} • {new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()}</p>
        {challenge.reward && <p className="mt-1 text-sm font-bold">🏆 {challenge.reward}</p>}
        {myRank ? <p className="mt-1 text-sm font-bold">Ton classement actuel : #{myRank}</p> : null}
      </header>

      {challenge.description && <section className="card text-sm text-zinc-200">{challenge.description}</section>}

      {challenge.challengeType === ChallengeType.COMPLETION && completionTarget > 0 && (
        <section className="card">
          <h2 className="section-title">Progression</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: completionTarget }).map((_, index) => {
              const done = index < completionHits;
              return (
                <span key={`dot-${index + 1}`} className={`h-5 w-5 rounded-full border-2 border-orange-400 ${done && challenge.completionMode === ChallengeCompletionMode.EXACT ? 'bg-orange-400/40' : ''}`} />
              );
            })}
          </div>
          {isCompleted ? <p className="mt-2 font-bold text-emerald-300">✅ Challenge complété</p> : <p className="mt-2 text-sm text-zinc-300">{completionHits}/{completionTarget} validés</p>}
        </section>
      )}

      <ChallengeFixturesClient fixtures={challenge.fixtures} />

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
