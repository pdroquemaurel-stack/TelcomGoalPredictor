import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { getDailyDisplayDays, setDailyDisplayDays } from '@/lib/services/daily-service';

const schema = z.object({
  days: z.number().int().min(1).max(7),
});

function isAdmin(role: unknown) {
  return role === 'ADMIN' || role === 'EDITOR';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !isAdmin(role)) return apiError('FORBIDDEN', 'Admin role required.', 403);

  const days = await getDailyDisplayDays();
  return apiSuccess({ days });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !isAdmin(role)) return apiError('FORBIDDEN', 'Admin role required.', 403);

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid days value.', 400, parsed.error.flatten());

  const days = await setDailyDisplayDays(parsed.data.days);
  return apiSuccess({ days });
}
