import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function ProfilePage() {
  const profile = await prisma.profile.findFirst({ include: { user: true, city: true, country: true } });

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold">Mon Profil</h1>
      <div className="card">
        <p>{profile?.displayName}</p>
        <p className="text-sm">{profile?.city?.name}, {profile?.country?.name}</p>
        <p className="text-sm">Favorite club: {profile?.favoriteClub}</p>
        <p className="text-sm">Level: {profile?.level}</p>
      </div>
      <div className="card text-sm">
        <p>Total predictions: {profile?.totalPredictions}</p>
        <p>Exact hits: {profile?.exactHits}</p>
        <p>Accuracy: {profile?.accuracyPct}%</p>
        <p>Total points: {profile?.totalPoints}</p>
        <p>Current streak: {profile?.currentStreak}</p>
        <p>Best streak: {profile?.bestStreak}</p>
        <p>Best rank: {profile?.bestLeaderboardRank ?? 'N/A'}</p>
      </div>
      <PlayerNav />
    </main>
  );
}
