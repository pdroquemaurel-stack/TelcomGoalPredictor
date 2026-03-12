export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
  const playerId = userId ?? fallbackUser?.id ?? '';

  const daily = await getDailyFixturesForUser(playerId);
  return apiSuccess(daily);
}
