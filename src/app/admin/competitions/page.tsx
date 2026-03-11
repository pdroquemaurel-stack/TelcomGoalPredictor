export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
export default async function Page(){ const comps = await prisma.competition.findMany({orderBy:{displayOrder:'asc'}}); return <div><h1 className='text-2xl font-bold mb-3'>Competition Management</h1><div className='card'>{comps.map(c=><p key={c.id}>{c.name} • active:{String(c.active)} • visible:{String(c.visible)}</p>)}</div></div>;}
