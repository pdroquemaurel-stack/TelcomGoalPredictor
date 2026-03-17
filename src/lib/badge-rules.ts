import { BadgeCriterionType } from '@prisma/client';
import { type BadgeProgress, isBadgeEarned } from '@/lib/badges';

export type BadgeRuleType = BadgeCriterionType;

export type BadgeRule = {
  type: BadgeRuleType;
  threshold: number;
};

export { type BadgeProgress };

export function isBadgeRuleEarned(rule: BadgeRule, progress: BadgeProgress) {
  return isBadgeEarned(rule.type, rule.threshold, progress);
}

export { isBadgeRuleEarned as isBadgeEarned };
