import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const signupSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
});

function buildEmailFromUsername(username: string) {
  return `${username.toLowerCase()}@players.local`;
}

function buildFriendCode(username: string) {
  return `USR-${username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(3, 'X')}`;
}

async function resolveFriendCode(baseCode: string) {
  let candidate = baseCode;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { friendCode: candidate }, select: { id: true } })) {
    candidate = `${baseCode}${String(suffix).padStart(2, '0')}`;
    suffix += 1;
  }

  return candidate;
}

export async function registerUser(payload: unknown) {
  const parsed = signupSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, status: 400, error: 'VALIDATION_ERROR', details: parsed.error.flatten() };
  }

  const username = parsed.data.username;
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) {
    return { ok: false as const, status: 409, error: 'USERNAME_EXISTS' };
  }

  const passwordHash = await hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email: buildEmailFromUsername(username),
      friendCode: await resolveFriendCode(buildFriendCode(username)),
      passwordHash,
      profile: {
        create: {
          displayName: username,
          acceptedTerms: true,
        },
      },
    },
    select: { id: true, username: true },
  });

  return { ok: true as const, user };
}
