import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rebuildLeaderboards } from '@/lib/leaderboard';
import { apiError, apiSuccess } from '@/lib/api';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) {
      return apiError('FORBIDDEN', 'Admin role required.', 403);
    }

    const result = await rebuildLeaderboards('AFRICA', 'ALL_TIME');
    return apiSuccess(result);
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Leaderboard rebuild failed.', 500, error instanceof Error ? error.message : error);
  }
}
