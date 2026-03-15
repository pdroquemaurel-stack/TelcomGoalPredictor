import type { ScorePrediction } from '@/lib/prediction-odds';

export type ScoreColorClasses = {
  home: string;
  away: string;
};

export function getPredictionScoreColorClasses(prediction: ScorePrediction | null): ScoreColorClasses {
  if (!prediction) return { home: 'text-zinc-200', away: 'text-zinc-200' };
  if (prediction.homeScore > prediction.awayScore) return { home: 'text-green-500', away: 'text-red-500' };
  if (prediction.homeScore < prediction.awayScore) return { home: 'text-red-500', away: 'text-green-500' };
  return { home: 'text-[#FF7900]', away: 'text-[#FF7900]' };
}
