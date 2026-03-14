import { apiSuccess } from '@/lib/api';
import { getDailyFixturesForUser } from '@/lib/services/daily-service';
import { getAuthenticatedUser } from '@/lib/session-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getAuthenticatedUser();
  const playerId = user?.id ?? '__anonymous__';

  const daily = await getDailyFixturesForUser(playerId);
  return apiSuccess(daily);
}
