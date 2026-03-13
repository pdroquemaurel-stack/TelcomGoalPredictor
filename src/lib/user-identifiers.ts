import type { PrismaClient } from '@prisma/client';

const USERNAME_SUFFIX_LENGTH = 4;
const FRIEND_CODE_LENGTH = 6;

type PrismaLike = Pick<PrismaClient, 'user'>;

function randomToken(length: number) {
  return Math.random().toString(36).slice(2, 2 + length).toLowerCase();
}

function normalizeUsernameBase(raw: string) {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized.length >= 3) return normalized.slice(0, 24);
  return `player_${randomToken(USERNAME_SUFFIX_LENGTH)}`;
}

export async function buildUniqueUsername(prisma: PrismaLike, preferred: string) {
  const base = normalizeUsernameBase(preferred);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? '' : `_${randomToken(USERNAME_SUFFIX_LENGTH)}`;
    const candidate = `${base}${suffix}`.slice(0, 30);
    const exists = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }

  throw new Error('Unable to generate a unique username');
}

function buildFriendCodeCandidate() {
  return `PLY${Math.random().toString(36).slice(2, 2 + FRIEND_CODE_LENGTH).toUpperCase()}`;
}

export async function buildUniqueFriendCode(prisma: PrismaLike, preferred?: string) {
  const preferredNormalized = preferred?.trim().toUpperCase();

  if (preferredNormalized) {
    const existing = await prisma.user.findUnique({ where: { friendCode: preferredNormalized }, select: { id: true } });
    if (!existing) return preferredNormalized;
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = buildFriendCodeCandidate();
    const exists = await prisma.user.findUnique({ where: { friendCode: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }

  throw new Error('Unable to generate a unique friend code');
}
