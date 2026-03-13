import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InviteAcceptCard } from './prompt';

export default async function InvitePage({ params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  const inviter = await prisma.user.findUnique({
    where: { friendCode: params.code },
    select: { id: true, profile: { select: { displayName: true } } },
  });

  if (!inviter) {
    return (
      <main className="mx-auto max-w-md p-4">
        <section className="card">
          <h1 className="text-xl font-black">Invitation introuvable</h1>
          <p className="mt-2 text-sm text-zinc-300">Ce lien n&apos;est plus valide.</p>
        </section>
      </main>
    );
  }

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${params.code}`)}`);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <section className="card">
        <h1 className="text-xl font-black">Invitation ami</h1>
        <p className="mt-2 text-sm text-zinc-300">
          {inviter.profile?.displayName ?? 'Un joueur'} vous invite à rejoindre son classement amis.
        </p>
      </section>

      <InviteAcceptCard code={params.code} inviterName={inviter.profile?.displayName ?? 'Ce joueur'} />
      <Link className="inline-block text-sm text-brand underline" href="/leaderboards?scope=friends">
        Retour au classement amis
      </Link>
    </main>
  );
}
