import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const profile = await prisma.profile.findFirst({ include: { user: true, city: true, country: true } });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Profil Joueur</p>
        <h1 className="mt-1 text-3xl font-black">{profile?.displayName ?? 'Player'}</h1>
        <p className="mt-1 text-sm font-semibold">{profile?.city?.name ?? 'Ville'} • {profile?.country?.name ?? 'Pays'}</p>
      </header>

      <section className="card border-brand bg-brand/10">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Résumé</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Niveau</p><p className="text-xl font-black">{profile?.level ?? 'Rookie'}</p></div>
          <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Points</p><p className="text-xl font-black text-brand">{profile?.totalPoints ?? 0}</p></div>
          <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Streak</p><p className="text-xl font-black">{profile?.currentStreak ?? 0}</p></div>
          <div className="rounded-2xl bg-black p-3"><p className="text-zinc-300">Best rank</p><p className="text-xl font-black">#{profile?.bestLeaderboardRank ?? '-'}</p></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Statistiques pronos</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Total pronos</span><strong>{profile?.totalPredictions ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Scores exacts</span><strong>{profile?.exactHits ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Précision</span><strong>{profile?.accuracyPct ?? 0}%</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Best streak</span><strong>{profile?.bestStreak ?? 0}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Badges & progression</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="game-chip bg-brand text-black">HOT STREAK</span>
          <span className="game-chip bg-white text-black">TOP 10</span>
          <span className="game-chip bg-zinc-700 text-white">CHALLENGER</span>
        </div>
        <p className="mt-3 text-sm text-zinc-300">Encore 2 pronos gagnants pour débloquer ton prochain badge.</p>
      </section>

      <section className="card">
        <h2 className="section-title">Compte & paramètres</h2>
        <div className="mt-3 space-y-2">
          <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold">Notifications: Activées</button>
          <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold">Club favori: {profile?.favoriteClub ?? 'Non défini'}</button>
          <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold">Langue: {profile?.language ?? 'fr'}</button>
        </div>
      </section>

      <PlayerNav />
    </main>
  );
}
