function toUtcDayKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function addDays(date: Date, offset: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}

export function calculatePredictionActivityStreak(activityDates: Date[], now = new Date()) {
  if (!activityDates.length) return 0;

  const uniqueDays = new Set(activityDates.map((date) => toUtcDayKey(date)));
  const latest = [...uniqueDays].sort().reverse()[0];
  if (!latest) return 0;

  const latestDate = new Date(`${latest}T00:00:00.000Z`);
  const todayKey = toUtcDayKey(now);
  const yesterdayKey = toUtcDayKey(addDays(now, -1));

  if (latest !== todayKey && latest !== yesterdayKey) return 0;

  let streak = 0;
  let cursor = latestDate;
  while (uniqueDays.has(toUtcDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
