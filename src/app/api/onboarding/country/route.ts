import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/session-user';
import { saveUserCountry } from '@/lib/onboarding-country';

const schema = z.object({ countryId: z.string().cuid() });

export async function POST(req: Request) {
  const me = await getAuthenticatedUser();
  if (!me) {
    return NextResponse.json({ error: { message: 'Authentication required.' } }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Invalid country selection.' } }, { status: 400 });
  }

  const result = await saveUserCountry(me.id, parsed.data.countryId);
  if (!result.ok) {
    return NextResponse.json({ error: { message: result.message } }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
