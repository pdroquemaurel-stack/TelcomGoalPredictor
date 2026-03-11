import { prisma } from '@/lib/prisma';
import { levelFromPoints } from '@/lib/utils';

const outcome = (h: number, a: number) => (h === a ? 'D' : h > a ? 'H' : 'A');

export function scorePrediction(predHome: number, predAway: number, actualHome: number, actualAway: number): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  if (outcome(predHome, predAway) === outcome(actualHome, actualAway)) return 1;
  return 0;
}

export async function rebuildUserStats(userId: string) {
  const predictions = await prisma.prediction.findMany({ where: { userId }, include: { fixture: true }, orderBy: { fixture: { utcKickoff: 'asc' } } });
  let totalPoints = 0;
  let exactHits = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  predictions.forEach((p) => {
    totalPoints += p.pointsAwarded;
    if (p.pointsAwarded === 3) exactHits += 1;
    if (p.pointsAwarded > 0) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  const totalPredictions = predictions.length;
  const accuracyPct = totalPredictions ? Math.round(((exactHits / totalPredictions) * 100) * 10) / 10 : 0;

  await prisma.profile.update({
    where: { userId },
    data: {
      totalPredictions,
      exactHits,
      totalPoints,
      accuracyPct,
      currentStreak,
      bestStreak,
      level: levelFromPoints(totalPoints),
    },
  });
}
