import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { requireOnboardedUser } from '@/lib/player-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const { me } = await requireOnboardedUser();

  const profile = await prisma.profile.findUnique({
    where: { userId: me.id },
    include: {
      user: { include: { badges: { include: { badge: true }, orderBy: { createdAt: 'desc' }, take: 4 } } },
      country: true,
    },
  });

  const badges = profile?.user.badges ?? [];

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Profil joueur</p>
        <h1 className="mt-1 text-3xl font-black">{profile?.displayName ?? 'Player'}</h1>
        <p className="mt-1 text-sm font-semibold">@{profile?.user.username ?? 'player'} • Niveau {profile?.level ?? 'Rookie'}</p>
      </header>

      <section className="card">
        <h2 className="section-title">KPI principaux</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-zinc-300">Points</p><p className="text-2xl font-black text-brand">{profile?.totalPoints ?? 0}</p></div>
          <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-zinc-300">Pronos</p><p className="text-2xl font-black">{profile?.totalPredictions ?? 0}</p></div>
          <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-zinc-300">Scores exacts</p><p className="text-2xl font-black">{profile?.exactHits ?? 0}</p></div>
          <div className="rounded-2xl bg-zinc-900 p-3"><p className="text-zinc-300">Précision</p><p className="text-2xl font-black">{Math.round(profile?.accuracyPct ?? 0)}%</p></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Progression</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Série en cours</span><strong>{profile?.currentStreak ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Meilleure série</span><strong>{profile?.bestStreak ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Meilleur rang</span><strong>{profile?.bestLeaderboardRank ?? '—'}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Pays</h2>
        <p className="mt-2 text-sm text-zinc-200">{profile?.country?.name ?? 'Pays non renseigné'}</p>
      </section>

      <section className="card">
        <h2 className="section-title">Badges</h2>
        {badges.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {badges.map((userBadge) => (
              <article key={userBadge.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-3">
                <p className="text-sm font-black">{userBadge.badge.name}</p>
                <p className="mt-1 text-xs text-zinc-300">{userBadge.badge.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-300">Aucun badge débloqué pour l’instant. Continue de jouer pour en gagner.</p>
        )}
      </section>

      <PlayerNav />
    </main>
  );
}
