import { compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const loginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
});

export async function authenticateByUsername(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    include: { profile: true },
  });

  if (!user?.passwordHash) return null;

  const ok = await compare(parsed.data.password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.profile?.displayName ?? user.username,
    role: user.role,
  } as any;
}
