import QRCode from 'qrcode';
import { PlayerNav } from '@/components/player-nav';
import { prisma } from '@/lib/prisma';

export default async function FriendsPage() {
  const me = await prisma.user.findFirst({ include: { profile: true } });
  const code = me?.friendCode ?? 'DEMO0000';
  const qr = await QRCode.toDataURL(`https://example.com/friends/add/${code}`);

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold">Friends</h1>
      <div className="card">
        <p>Your friend code: <strong>{code}</strong></p>
        <img src={qr} alt="Friend QR" className="mt-2 h-36 w-36" />
      </div>
      <div className="card">Pending requests and accepted friends list (MVP placeholder).</div>
      <PlayerNav />
    </main>
  );
}
