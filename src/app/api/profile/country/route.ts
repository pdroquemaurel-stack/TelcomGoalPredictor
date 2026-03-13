import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { AFRICAN_COUNTRIES } from '@/lib/countries';
import { prisma } from '@/lib/prisma';

const payloadSchema = z.object({
  countryCode: z.string().min(2).max(3),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const selected = AFRICAN_COUNTRIES.find((item) => item.code === parsed.data.countryCode.toUpperCase());
  if (!selected) {
    return NextResponse.json({ error: 'Country not found' }, { status: 400 });
  }

  const country = await prisma.country.upsert({
    where: { code: selected.code },
    update: { name: selected.name },
    create: { code: selected.code, name: selected.name },
    select: { id: true },
  });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

  await prisma.profile.upsert({
    where: { userId },
    update: { countryId: country.id },
    create: {
      userId,
      displayName: me?.username ?? 'Joueur',
      acceptedTerms: true,
      countryId: country.id,
    },
  });

  return NextResponse.json({ ok: true });
}
