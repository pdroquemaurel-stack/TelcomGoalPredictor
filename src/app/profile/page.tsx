import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { PlayerNav } from '@/components/player-nav';
import { ProfileCountryEditor } from '@/components/profile-country-editor';
import { authOptions } from '@/lib/auth';
import { AFRICAN_COUNTRIES } from '@/lib/countries';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect('/');
  }

  const profile = await prisma.profile.findUnique({ where: { userId }, include: { user: true, country: true } });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-white p-5 text-black shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">Profil</p>
        <h1 className="mt-1 text-3xl font-black">{profile?.displayName ?? (session?.user as any)?.username ?? 'Player'}</h1>
        <p className="mt-1 text-sm font-semibold">@{(session?.user as any)?.username ?? 'player'}</p>
      </header>

      <section className="card">
        <h2 className="section-title">Statistiques</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Points</span><strong>{profile?.totalPoints ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Pronos effectués</span><strong>{profile?.totalPredictions ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Scores exacts</span><strong>{profile?.exactHits ?? 0}</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Précision</span><strong>{Math.round(profile?.accuracyPct ?? 0)}%</strong></div>
          <div className="flex justify-between rounded-xl bg-zinc-900 p-3"><span>Best streak</span><strong>{profile?.bestStreak ?? 0}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Compte</h2>
        <div className="mt-3 space-y-2">
          <ProfileCountryEditor
            countries={AFRICAN_COUNTRIES}
            currentCountryCode={profile?.country?.code}
            currentCountryName={profile?.country?.name}
          />
          <form action="/api/auth/signout" method="post">
            <input name="callbackUrl" type="hidden" value="/" />
            <button className="block w-full rounded-2xl border border-rose-400/40 bg-rose-950/30 px-4 py-3 text-left text-sm font-black text-rose-100" type="submit">
              Se déconnecter
            </button>
          </form>
        </div>
      </section>

      <PlayerNav />
    </main>
  );
}
