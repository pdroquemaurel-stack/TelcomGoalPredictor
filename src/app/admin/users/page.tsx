export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
export default async function Page(){const users=await prisma.user.findMany({include:{profile:true},take:100});return <div><h1 className='text-2xl font-bold mb-3'>User Management</h1><div className='card'>{users.map(u=><p key={u.id}>{u.profile?.displayName || u.email} • {u.email} • {u.status}</p>)}</div></div>;}
