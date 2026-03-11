import { prisma } from '@/lib/prisma';
export default async function Page(){const items=await prisma.product.findMany();return <div><h1 className='text-2xl font-bold mb-3'>Products / Bonus</h1><div className='card'>{items.map(p=><p key={p.id}>{p.name} • {p.currency} {p.price.toString()} • sponsored:{String(p.sponsored)}</p>)}</div></div>;}
