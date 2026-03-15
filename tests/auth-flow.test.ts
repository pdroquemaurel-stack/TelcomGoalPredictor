import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authenticateByUsername } from '@/lib/auth-credentials';
import { registerUser } from '@/lib/signup';
import { getSessionUserId } from '@/lib/auth-session';

test('login with username works', async () => {
  const passwordHash = await hash('secret123', 10);
  const originalFindUnique = prisma.user.findUnique;

  prisma.user.findUnique = (async ({ where }: any) => {
    if (where.username === 'joueur1') {
      return {
        id: 'u1',
        email: 'joueur1@demo.local',
        username: 'joueur1',
        passwordHash,
        role: 'PLAYER',
        profile: { displayName: 'Joueur 1' },
      } as any;
    }
    return null;
  }) as any;

  const result = await authenticateByUsername({ username: 'joueur1', password: 'secret123' });
  assert.equal(result?.id, 'u1');

  prisma.user.findUnique = originalFindUnique;
});

test('login fails with wrong password', async () => {
  const passwordHash = await hash('secret123', 10);
  const originalFindUnique = prisma.user.findUnique;

  prisma.user.findUnique = (async () => ({
    id: 'u1',
    email: 'joueur1@demo.local',
    username: 'joueur1',
    passwordHash,
    role: 'PLAYER',
    profile: { displayName: 'Joueur 1' },
  })) as any;

  const result = await authenticateByUsername({ username: 'joueur1', password: 'wrongpass' });
  assert.equal(result, null);

  prisma.user.findUnique = originalFindUnique;
});

test('signup fails when username already exists', async () => {
  const originalFindUnique = prisma.user.findUnique;

  prisma.user.findUnique = (async ({ where }: any) => {
    if (where.username === 'taken') return { id: 'existing' } as any;
    return null;
  }) as any;

  const result = await registerUser({ username: 'taken', password: 'secret123' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'USERNAME_EXISTS');

  prisma.user.findUnique = originalFindUnique;
});

test('signup creates a valid user', async () => {
  const originalFindUnique = prisma.user.findUnique;
  const originalCreate = prisma.user.create;

  prisma.user.findUnique = (async () => null) as any;
  prisma.user.create = (async ({ data }: any) => ({
    id: 'new-user',
    username: data.username,
  })) as any;

  const result = await registerUser({ username: 'newplayer', password: 'secret123' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.user.id, 'new-user');

  prisma.user.findUnique = originalFindUnique;
  prisma.user.create = originalCreate;
});

test('API auth helper returns null user id when no session', () => {
  const userId = getSessionUserId(null);
  assert.equal(userId, null);
});
