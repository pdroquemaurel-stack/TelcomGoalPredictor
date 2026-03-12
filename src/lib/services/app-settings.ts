import { prisma } from '@/lib/prisma';

const UPCOMING_DAYS_KEY = 'daily.upcomingDays';
const DEFAULT_UPCOMING_DAYS = 2;

export function normalizeUpcomingDays(value: number) {
  return Math.min(7, Math.max(1, Math.round(value)));
}

export async function getUpcomingDaysSetting() {
  const row = await prisma.appSetting.findUnique({ where: { key: UPCOMING_DAYS_KEY } });
  if (!row) return DEFAULT_UPCOMING_DAYS;
  const parsed = Number(row.value);
  if (!Number.isFinite(parsed)) return DEFAULT_UPCOMING_DAYS;
  return normalizeUpcomingDays(parsed);
}

export async function setUpcomingDaysSetting(value: number) {
  const normalized = normalizeUpcomingDays(value);
  await prisma.appSetting.upsert({
    where: { key: UPCOMING_DAYS_KEY },
    create: { key: UPCOMING_DAYS_KEY, value: String(normalized) },
    update: { value: String(normalized) },
  });
  return normalized;
}
