import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ productId: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const purchase = await prisma.purchase.create({ data: { productId: parsed.data.productId, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true, purchase, message: 'Mock checkout complete for MVP demo mode.' });
}
