import { apiError, apiSuccess } from '@/lib/api';
import { registerUser } from '@/lib/signup';

export async function POST(req: Request) {
  const payload = await req.json();
  const result = await registerUser(payload);

  if (!result.ok) {
    if (result.error === 'VALIDATION_ERROR') {
      return apiError('VALIDATION_ERROR', 'Invalid sign up payload.', result.status, result.details);
    }
    if (result.error === 'USERNAME_EXISTS') {
      return apiError('VALIDATION_ERROR', 'Ce pseudo est déjà utilisé.', result.status);
    }
    return apiError('INTERNAL_ERROR', 'Unable to create account.', result.status);
  }

  return apiSuccess({ user: result.user });
}
