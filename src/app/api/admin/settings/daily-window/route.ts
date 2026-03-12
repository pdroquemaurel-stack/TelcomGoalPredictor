import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { getUpcomingDaysSetting, setUpcomingDaysSetting } from '@/lib/services/app-settings';

const schema = z.object({ days: z.number().int().min(1).max(7) });

function canManage(role?: string) {
  return role === 'ADMIN' || role === 'EDITOR';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session?.user || !canManage(role)) return apiError('FORBIDDEN', 'Admin access required.', 403);

  const days = await getUpcomingDaysSetting();
  return apiSuccess({ days });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session?.user || !canManage(role)) return apiError('FORBIDDEN', 'Admin access required.', 403);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid days value.', 400, parsed.error.flatten());

  const days = await setUpcomingDaysSetting(parsed.data.days);
  return apiSuccess({ days });
}
