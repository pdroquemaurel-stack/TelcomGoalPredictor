import { prisma } from '@/lib/prisma';
export default async function Page(){const items=await prisma.sponsorCampaign.findMany({orderBy:{priority:'desc'}});return <div><h1 className='text-2xl font-bold mb-3'>Sponsor Campaigns</h1><div className='card'>{items.map(c=><p key={c.id}>{c.name} • {c.type} • active:{String(c.active)}</p>)}</div></div>;}
