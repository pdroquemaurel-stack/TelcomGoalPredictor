import { requireOnboardedUser } from '@/lib/player-access';

export default async function FriendsPage() {
  await requireOnboardedUser();
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-2xl font-black">Friends</h1>
      <p className="card text-sm">Cette fonctionnalité est temporairement désactivée pour le MVP. Le focus produit est sur les pronostics, résultats et classement.</p>
    </main>
  );
}
