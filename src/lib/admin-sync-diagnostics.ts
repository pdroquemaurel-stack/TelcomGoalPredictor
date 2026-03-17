import type { ApiErrorCode } from '@/lib/api';
import { ZodError } from 'zod';

export type AdminSyncStep =
  | 'auth'
  | 'config'
  | 'syncCompetitions'
  | 'syncFixtures'
  | 'settleFinishedFixtures'
  | 'responseContract';

const MAX_DETAILS_LENGTH = 240;

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

function truncate(value: string) {
  if (value.length <= MAX_DETAILS_LENGTH) return value;
  return `${value.slice(0, MAX_DETAILS_LENGTH)}…`;
}

export function validateAdminSyncConfig(env: NodeJS.ProcessEnv = process.env) {
  if (!env.FOOTBALL_DATA_API_KEY) {
    return 'Missing FOOTBALL_DATA_API_KEY';
  }
  return null;
}

export function formatAdminSyncError(step: AdminSyncStep, error: unknown): {
  code: ApiErrorCode;
  message: string;
  details: string;
} {
  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Validation du contrat de sync échouée.',
      details: `Step ${step}: ${truncate(error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' | '))}`,
    };
  }

  const reason = truncate(stringifyError(error));

  if (step === 'config' || /missing|invalid|required/i.test(reason)) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Configuration de sync invalide.',
      details: `Step ${step}: ${reason}`,
    };
  }

  if (/football-data error|provider|timeout|network|fetch failed/i.test(reason)) {
    return {
      code: 'EXTERNAL_PROVIDER_ERROR',
      message: 'Erreur du provider de données football.',
      details: `Step ${step}: ${reason}`,
    };
  }

  if (/fixture|settlement|prediction|leaderboard|business/i.test(reason)) {
    return {
      code: 'BUSINESS_ERROR',
      message: 'Erreur métier pendant la sync.',
      details: `Step ${step}: ${reason}`,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Erreur inconnue pendant la sync.',
    details: `Step ${step}: ${reason}`,
  };
}
