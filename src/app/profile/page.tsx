import Link from 'next/link';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/session-user';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const me = await requireAuthenticatedUser();

  const profile = await prisma.profile.findUnique({ where: { userId: me.id }, include: { user: true } });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Profil</p>
        <h1 className="mt-1 text-3xl font-black">{profile?.displayName ?? 'Player'}</h1>
        <p className="mt-1 text-sm font-semibold">{profile?.user.username ?? 'player'}</p>
      </header>

      <section className="card">
        <h2 className="section-title">Statistiques</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Points</span><strong>{profile?.totalPoints ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Pronos effectués</span><strong>{profile?.totalPredictions ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Scores exacts</span><strong>{profile?.exactHits ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Précision</span><strong>{profile?.accuracyPct ?? 0}%</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Best streak</span><strong>{profile?.bestStreak ?? 0}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Compte</h2>
        <div className="mt-3 space-y-2">
          <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold">Notifications: Activées</button>
          <button className="w-full rounded-2xl border border-white/20 bg-zinc-900 px-4 py-3 text-left text-sm font-bold">Langue: Français</button>
          <Link className="block w-full rounded-2xl border border-rose-400/40 bg-rose-950/30 px-4 py-3 text-sm font-black text-rose-100" href="/auth/signin">Se déconnecter</Link>
        </div>
      </section>

      <PlayerNav />
    </main>
  );
}
