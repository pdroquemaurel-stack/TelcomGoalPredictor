import { BadgeCriterionType } from '@prisma/client';
import { z } from 'zod';

export const BADGE_IMAGE_DIR = '/badges';
export const BADGE_IMAGE_FALLBACK = `${BADGE_IMAGE_DIR}/badge.webp`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBadgeInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est obligatoire.')
    .regex(SLUG_PATTERN, 'Le slug doit contenir uniquement des lettres minuscules, des chiffres et des tirets.'),
  criterionType: z.nativeEnum(BadgeCriterionType),
  threshold: z.coerce.number().int().positive('Le seuil doit être supérieur à 0.'),
  description: z.string().trim().max(280).optional(),
  isActive: z.coerce.boolean().optional().default(true),
  displayOrder: z.coerce.number().int().optional().default(0),
});

export type BadgeProgress = {
  predictionCount: number;
  correctPredictionCount: number;
  exactPredictionCount: number;
};

export function normalizeBadgeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

export function getBadgeImagePath(slug: string, imageExists: boolean) {
  if (!slug || !imageExists) return BADGE_IMAGE_FALLBACK;
  return `${BADGE_IMAGE_DIR}/${slug}.webp`;
}

export function isBadgeEarned(criterionType: BadgeCriterionType, threshold: number, progress: BadgeProgress) {
  if (criterionType === BadgeCriterionType.PREDICTION_COUNT) {
    return progress.predictionCount >= threshold;
  }

  if (criterionType === BadgeCriterionType.CORRECT_PREDICTION_COUNT) {
    return progress.correctPredictionCount >= threshold;
  }

  return progress.exactPredictionCount >= threshold;
}
