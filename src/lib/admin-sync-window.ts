const DAY_MS = 86400000;

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function buildAdminSyncWindow(now = new Date(), daysBack = 3, daysAhead = 7) {
  const from = new Date(now.getTime() - daysBack * DAY_MS);
  const to = new Date(now.getTime() + daysAhead * DAY_MS);

  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
  };
}
