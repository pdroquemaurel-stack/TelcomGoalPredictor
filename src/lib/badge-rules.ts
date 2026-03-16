export type BadgeRuleType = 'total_predictions' | 'winning_predictions' | 'exact_predictions';

export type BadgeRule = {
  type: BadgeRuleType;
  threshold: number;
};

export type BadgeProgress = {
  totalPredictions: number;
  winningPredictions: number;
  exactPredictions: number;
};

export function isBadgeEarned(rule: BadgeRule, progress: BadgeProgress) {
  if (rule.type === 'total_predictions') return progress.totalPredictions >= rule.threshold;
  if (rule.type === 'winning_predictions') return progress.winningPredictions >= rule.threshold;
  return progress.exactPredictions >= rule.threshold;
}
