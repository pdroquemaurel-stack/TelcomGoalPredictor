import { calculatePredictionPoints } from '@/lib/scoring';

export type ChallengePredictionRow = {
  userId: string;
  displayName: string;
  predictedHome: number;
  predictedAway: number;
  finalHome: number | null;
  finalAway: number | null;
};

export function buildChallengeLeaderboard(rows: ChallengePredictionRow[]) {
  const scores = new Map<string, { userId: string; displayName: string; points: number; exactHits: number; played: number }>();

  for (const row of rows) {
    const current = scores.get(row.userId) ?? {
      userId: row.userId,
      displayName: row.displayName,
      points: 0,
      exactHits: 0,
      played: 0,
    };

    const points = row.finalHome === null || row.finalAway === null
      ? 0
      : calculatePredictionPoints(row.predictedHome, row.predictedAway, row.finalHome, row.finalAway);

    current.points += points;
    current.played += 1;
    if (points === 3) current.exactHits += 1;
    scores.set(row.userId, current);
  }

  return Array.from(scores.values())
    .sort((a, b) => b.points - a.points || b.exactHits - a.exactHits || a.displayName.localeCompare(b.displayName))
    .map((row, index) => ({ rank: index + 1, ...row }));
}
