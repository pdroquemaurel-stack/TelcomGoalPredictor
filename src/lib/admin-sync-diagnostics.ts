export type AdminSyncStep =
  | 'auth'
  | 'config'
  | 'syncCompetitions'
  | 'syncFixtures'
  | 'settleFinishedFixtures';

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

export function formatAdminSyncError(step: AdminSyncStep, error: unknown) {
  const reason = truncate(stringifyError(error));
  return {
    message: 'Fixture sync failed.',
    details: `Step ${step}: ${reason}`,
  };
}
