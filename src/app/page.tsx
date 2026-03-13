import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuthLanding } from '@/components/auth-landing';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (userId) {
    redirect('/daily');
  }

  return <AuthLanding />;
}
