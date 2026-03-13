import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/sign-in-form';
import { authOptions } from '@/lib/auth';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (userId) {
    redirect('/daily');
  }

  return <SignInForm />;
}
