import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { buildUniqueFriendCode, buildUniqueUsername } from '@/lib/user-identifiers';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(30),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà pour cet email.' }, { status: 409 });
  }

  const passwordHash = await hash(parsed.data.password, 10);

  const baseUsername = email.split('@')[0];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const username = await buildUniqueUsername(prisma, baseUsername);
    const friendCode = await buildUniqueFriendCode(prisma);

    try {
      const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      friendCode,
      profile: {
        create: {
          displayName: parsed.data.displayName,
          acceptedTerms: true,
          onboardingCompleted: false,
        },
      },
    },
        select: { id: true },
      });

      return NextResponse.json({ ok: true, userId: user.id });
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined;
      if (code === 'P2002') continue;
      throw error;
    }
  }

  return NextResponse.json({ error: 'Impossible de créer un compte pour le moment.' }, { status: 503 });
}
