import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { AFRICAN_COUNTRIES } from '@/lib/countries';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  countryCode: z.string().min(2).max(3),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const country = AFRICAN_COUNTRIES.find((item) => item.code === parsed.data.countryCode.toUpperCase());

  if (!country) {
    return NextResponse.json({ error: 'Country not found' }, { status: 400 });
  }

  const countryRow = await prisma.country.upsert({
    where: { code: country.code },
    update: { name: country.name },
    create: { code: country.code, name: country.name },
    select: { id: true },
  });

  await prisma.profile.upsert({
    where: { userId },
    update: {
      countryId: countryRow.id,
      onboardingCompleted: true,
    },
    create: {
      userId,
      displayName: session?.user?.name ?? 'Joueur',
      acceptedTerms: true,
      countryId: countryRow.id,
      onboardingCompleted: true,
    },
  });

  return NextResponse.json({ ok: true });
}
