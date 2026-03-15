import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export type AuthenticatedUser = {
  id: string;
  role?: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  if (!id) return null;
  return { id, role: (session?.user as any)?.role as string | undefined };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/auth/signin');
  return user;
}
