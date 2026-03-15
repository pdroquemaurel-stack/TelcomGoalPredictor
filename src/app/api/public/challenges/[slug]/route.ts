import { apiError, apiSuccess } from '@/lib/api';
import { getChallengeDetailBySlug } from '@/lib/services/challenge-service';
import { getAuthenticatedUser } from '@/lib/session-user';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const user = await getAuthenticatedUser();
  const playerId = user?.id ?? '__anonymous__';

  const detail = await getChallengeDetailBySlug(params.slug, playerId);
  if (!detail) return apiError('NOT_FOUND', 'Challenge not found.', 404);
  return apiSuccess(detail);
}
