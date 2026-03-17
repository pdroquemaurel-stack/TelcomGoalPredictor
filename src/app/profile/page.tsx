import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { requireOnboardedUser } from '@/lib/player-access';
import { LogoutButton } from '@/components/logout-button';
import { calculatePredictionActivityStreak } from '@/lib/profile-streak';
import { resolveBadgeImagePath } from '@/lib/badge-image';
import { InviteFriendsSheet } from '@/components/invite-friends-sheet';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function StreakDots({ streak }: { streak: number }) {
  const displayed = Math.max(1, Math.min(streak, 7));

  return (
    <section className="card">
      <h2 className="section-title">Streak 7 jours</h2>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, index) => {
          const filled = index < displayed;
          return (
            <div key={index + 1} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${filled ? 'bg-[#FF7900] text-black' : 'bg-zinc-800 text-zinc-300'}`}>
              {index + 1}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function ProfilePage() {
  const { me } = await requireOnboardedUser();

  const [profile, allBadges, predictions, userIdentity] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: me.id },
      include: {
        user: { include: { badges: { include: { badge: true }, orderBy: { createdAt: 'desc' } } } },
        country: true,
      },
    }),
    prisma.badge.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { threshold: 'asc' }, { name: 'asc' }] }),
    prisma.prediction.findMany({ where: { userId: me.id }, select: { createdAt: true } }),
    prisma.user.findUnique({ where: { id: me.id }, select: { username: true, friendCode: true } }),
  ]);

  const ownedBadgeIds = new Set((profile?.user.badges ?? []).map((item) => item.badgeId));
  const orderedBadges = allBadges
    .map((badge) => ({ badge, earned: ownedBadgeIds.has(badge.id) }))
    .sort((a, b) => Number(b.earned) - Number(a.earned) || a.badge.name.localeCompare(b.badge.name));

  const streak = calculatePredictionActivityStreak(predictions.map((prediction) => prediction.createdAt));

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Profil joueur</p>
        <h1 className="mt-1 text-3xl font-black">{profile?.displayName ?? 'Player'}</h1>
        <p className="mt-1 text-sm font-semibold">@{profile?.user.username ?? 'player'} • Niveau {profile?.level ?? 'Rookie'}</p>
      </header>

      <StreakDots streak={streak} />

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
        {orderedBadges.length > 0 ? (
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
            {orderedBadges.map(({ badge, earned }) => (
              <article key={badge.id} className={`min-w-[190px] snap-start rounded-2xl border p-3 ${earned ? 'border-brand/60 bg-zinc-900' : 'border-white/10 bg-zinc-900/60 opacity-60'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={badge.name} className="h-16 w-16 rounded-xl object-cover" src={resolveBadgeImagePath(badge.slug)} />
                <p className="mt-2 text-sm font-black">{badge.name}</p>
                <p className="mt-1 text-xs text-zinc-300">{badge.description}</p>
                <p className={`mt-2 text-[11px] font-black ${earned ? 'text-emerald-400' : 'text-zinc-400'}`}>{earned ? 'Obtenu' : 'À débloquer'}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-300">Aucun badge disponible pour l’instant.</p>
        )}
      </section>

      <section className="card">
        <InviteFriendsSheet
          friendCode={userIdentity?.friendCode ?? 'INDISPONIBLE'}
          username={userIdentity?.username ?? 'player'}
        />
      </section>

      <section className="card">
        <LogoutButton />
      </section>

      <PlayerNav />
    </main>
  );
}
