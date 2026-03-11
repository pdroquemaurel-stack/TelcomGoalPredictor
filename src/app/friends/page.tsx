import Image from 'next/image';
import QRCode from 'qrcode';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FriendsPage() {
  const me = await prisma.user.findFirst({ include: { profile: true } });
  const code = me?.friendCode ?? 'DEMO0000';
  const qr = await QRCode.toDataURL(`https://example.com/friends/add/${code}`);

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-5">
      <h1 className="text-2xl font-bold">Leagues & Friends</h1>

      <section className="card">
        <p className="text-xs uppercase tracking-wide text-slate-500">Your Invite</p>
        <p className="mt-1 text-sm">Share your friend code to build a private competition group.</p>
        <p className="mt-2 text-lg font-bold">{code}</p>
        <Image src={qr} alt="Friend QR" width={128} height={128} unoptimized className="mt-3 rounded-lg border border-slate-200" />
      </section>

      <section className="card space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Public leagues</h2>
          <button className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">Create league</button>
        </div>
        {[
          { name: 'City Rivals', members: 28 },
          { name: 'Campus Derby League', members: 41 },
          { name: 'Weekend Legends', members: 19 },
        ].map((league) => (
          <div key={league.name} className="rounded-xl border border-slate-200 p-3">
            <p className="font-semibold">{league.name}</p>
            <p className="text-xs text-slate-500">{league.members} members • Weekly ranking active</p>
            <p className="mt-1 text-xs text-slate-600">Top 3 earn status badges this week.</p>
          </div>
        ))}
      </section>

      <section className="card text-sm text-slate-600">Friend requests and direct challenge invites will appear here.</section>
      <PlayerNav />
    </main>
  );
}
