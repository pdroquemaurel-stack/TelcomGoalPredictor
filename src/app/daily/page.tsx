import { getServerSession } from 'next-auth';
import { PlayerNav } from '@/components/player-nav';
import { DailyView } from '@/components/daily-view';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
  const session = await getServerSession(authOptions);
  const me = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const userId = me ?? fallbackUser?.id ?? '';
  const daily = await getDailyFixturesForUser(userId);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-5">
      <header className="rounded-3xl bg-brand p-5 text-black">
        <p className="text-xs font-black uppercase tracking-[0.18em]">Prono du jour</p>
        <h1 className="mt-1 text-2xl font-black">Pronos sur {daily.displayDays} jour{daily.displayDays > 1 ? 's' : ''}</h1>
      </header>
      <DailyView upcomingGroups={daily.upcomingGroups} pastGroups={daily.pastGroups} />
      <PlayerNav />
    </main>
  );
}
