export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { syncCompetitions, syncFixtures } from '@/lib/sync';

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 10 * 86400000).toISOString().slice(0, 10);
  await syncCompetitions();
  await syncFixtures(from, to);
  return NextResponse.json({ ok: true });
}
