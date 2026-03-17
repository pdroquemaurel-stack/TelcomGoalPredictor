export const SCORING_RULES = {
  exactScore: 3,
  correctOutcome: 1,
  incorrect: 0,
} as const;

export type MatchOutcome = 'HOME' | 'AWAY' | 'DRAW';

export function getMatchOutcome(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) return 'HOME';
  if (awayScore > homeScore) return 'AWAY';
  return 'DRAW';
}

export function calculatePredictionPoints(
  predictedHomeScore: number,
  predictedAwayScore: number,
  actualHomeScore: number,
  actualAwayScore: number,
): number {
  if (predictedHomeScore === actualHomeScore && predictedAwayScore === actualAwayScore) {
    return SCORING_RULES.exactScore;
  }

  if (getMatchOutcome(predictedHomeScore, predictedAwayScore) === getMatchOutcome(actualHomeScore, actualAwayScore)) {
    return SCORING_RULES.correctOutcome;
  }

  return SCORING_RULES.incorrect;
}

export function isFixtureFinished(statusText: string, homeScore: number | null, awayScore: number | null): boolean {
  if (homeScore === null || awayScore === null) return false;
  const normalizedStatus = statusText.toUpperCase();
  return ['FINISHED', 'FT', 'AET', 'PEN', 'SETTLED'].includes(normalizedStatus) || normalizedStatus.includes('FINISHED');
}
