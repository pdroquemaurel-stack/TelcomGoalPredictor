export type LeaderboardPeriodFilter = 'all-time' | 'weekly' | 'monthly';

export function getPeriodStart(period: LeaderboardPeriodFilter, now = new Date()) {
  if (period === 'all-time') return null;
  const date = new Date(now);
  if (period === 'weekly') {
    date.setDate(date.getDate() - 7);
  } else {
    date.setMonth(date.getMonth() - 1);
  }
  return date;
}

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  username: string;
  countryName: string;
  totalPredictions: number;
  points: number;
  exactHits: number;
};

export function toRankedRows(rows: LeaderboardRow[]) {
  return [...rows]
    .sort((a, b) => b.points - a.points || b.exactHits - a.exactHits || a.username.localeCompare(b.username))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
