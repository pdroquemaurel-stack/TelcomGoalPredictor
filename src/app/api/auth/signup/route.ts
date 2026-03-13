import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(30),
});

function buildFriendCode() {
  return `PLY${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

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

  let friendCode = buildFriendCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const used = await prisma.user.findUnique({ where: { friendCode }, select: { id: true } });
    if (!used) break;
    friendCode = buildFriendCode();
  }

  const user = await prisma.user.create({
    data: {
      email,
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
}
