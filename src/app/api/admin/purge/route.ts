export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { purgeCompetitionData } from '@/lib/services/admin-maintenance-service';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || role !== 'ADMIN') return apiError('FORBIDDEN', 'Admin role required.', 403);

  const body = await req.json().catch(() => ({}));
  if (body?.confirmation !== 'DELETE') return apiError('VALIDATION_ERROR', 'Confirmation must be DELETE.', 400);

  const summary = await purgeCompetitionData();
  return apiSuccess(summary);
}
