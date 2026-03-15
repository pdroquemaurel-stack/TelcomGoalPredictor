export type MatchOutcome = 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';

export type ScorePrediction = {
  homeScore: number;
  awayScore: number;
};

export type MatchOdds = {
  homeWin: number;
  draw: number;
  awayWin: number;
};


export type StoredPrediction = ScorePrediction & {
  userId: string;
};

type PredictionWithUserId = {
  userId: string;
};

export function filterOutCurrentUserPredictions<T extends PredictionWithUserId>(
  predictions: T[],
  currentUserId: string,
): T[] {
  return predictions.filter((prediction) => prediction.userId !== currentUserId);
}

const ODDS_PRECISION = 2;
const FALLBACK_ODDS: MatchOdds = {
  homeWin: 3,
  draw: 3,
  awayWin: 3,
};

function roundOdds(value: number) {
  return Number(value.toFixed(ODDS_PRECISION));
}

export function getPredictedOutcome(prediction: ScorePrediction): MatchOutcome {
  if (prediction.homeScore > prediction.awayScore) return 'HOME_WIN';
  if (prediction.homeScore < prediction.awayScore) return 'AWAY_WIN';
  return 'DRAW';
}

export function calculateMatchOdds(predictions: ScorePrediction[]): MatchOdds {
  if (!predictions.length) return FALLBACK_ODDS;

  const counts: Record<MatchOutcome, number> = {
    HOME_WIN: 0,
    DRAW: 0,
    AWAY_WIN: 0,
  };

  predictions.forEach((prediction) => {
    counts[getPredictedOutcome(prediction)] += 1;
  });

  /**
   * MVP odds model:
   * - count distribution of outcomes among other players
   * - apply Laplace smoothing (+1 pseudo-count per outcome) to avoid zero probability
   * - decimal odds = 1 / smoothedProbability
   */
  const outcomeCount = 3;
  const smoothedTotal = predictions.length + outcomeCount;

  return {
    homeWin: roundOdds(smoothedTotal / (counts.HOME_WIN + 1)),
    draw: roundOdds(smoothedTotal / (counts.DRAW + 1)),
    awayWin: roundOdds(smoothedTotal / (counts.AWAY_WIN + 1)),
  };
}
