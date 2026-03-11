import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'ADMIN' && role !== 'EDITOR')) redirect('/auth/signin');
  return <AdminShell>{children}</AdminShell>;
}
