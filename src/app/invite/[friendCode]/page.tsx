import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AcceptFriendInviteButton } from '@/components/accept-friend-invite-button';

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: { friendCode: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${params.friendCode}`)}`);
  }

  const inviter = await prisma.user.findUnique({
    where: { friendCode: params.friendCode },
    include: { profile: { select: { displayName: true } } },
  });

  if (!inviter) {
    return (
      <main className="mx-auto max-w-md p-4">
        <section className="card space-y-2">
          <h1 className="text-xl font-black">Invitation introuvable</h1>
          <Link className="text-sm text-brand" href="/leaderboards?scope=friends">Retour</Link>
        </section>
      </main>
    );
  }

  if (inviter.id === userId) {
    return (
      <main className="mx-auto max-w-md p-4">
        <section className="card space-y-2">
          <h1 className="text-xl font-black">C’est votre lien d’invitation</h1>
          <p className="text-sm text-zinc-300">Partagez-le avec vos amis pour agrandir votre classement Ami.</p>
          <Link className="text-sm text-brand" href="/leaderboards?scope=friends">Voir le classement ami</Link>
        </section>
      </main>
    );
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: inviter.id, addresseeId: userId },
        { requesterId: userId, addresseeId: inviter.id },
      ],
    },
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <section className="card space-y-3">
        <h1 className="text-xl font-black">Invitation ami</h1>
        <p className="text-sm text-zinc-300">{inviter.profile?.displayName ?? inviter.username} vous invite à rejoindre son cercle d’amis.</p>
        {existing?.status === 'ACCEPTED' ? (
          <p className="rounded-xl bg-green-900/30 p-3 text-sm text-green-300">Vous êtes déjà amis ✅</p>
        ) : (
          <AcceptFriendInviteButton inviterId={inviter.id} />
        )}
        <Link className="text-xs text-brand" href="/leaderboards?scope=friends">Aller au classement Ami</Link>
      </section>
    </main>
  );
}
