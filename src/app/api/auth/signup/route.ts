import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const signupSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
});

function buildFriendCode() {
  return `PLY${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Pseudo ou mot de passe invalide.' }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'Ce pseudo est déjà pris.' }, { status: 409 });
  }

  const passwordHash = await hash(parsed.data.password, 10);

  let friendCode = buildFriendCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const used = await prisma.user.findUnique({ where: { friendCode }, select: { id: true } });
    if (!used) break;
    friendCode = buildFriendCode();
  }

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      friendCode,
      profile: {
        create: {
          displayName: parsed.data.username,
          acceptedTerms: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
