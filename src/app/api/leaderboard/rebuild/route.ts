import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { rebuildLeaderboards } from '@/lib/leaderboard';

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await rebuildLeaderboards('AFRICA', 'ALL_TIME');
  return NextResponse.json({ ok: true });
}
