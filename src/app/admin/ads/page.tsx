export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
export default async function Page(){const slots=await prisma.adSlot.findMany({include:{campaign:true}});return <div><h1 className='text-2xl font-bold mb-3'>Ad Inventory</h1><div className='card'>{slots.map(s=><p key={s.id}>{s.code} → {s.campaign?.name || 'No campaign'}</p>)}</div></div>;}
