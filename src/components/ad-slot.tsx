import Link from 'next/link';
import { AdSlotCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function AdSlotView({ code }: { code: AdSlotCode }) {
  const slot = await prisma.adSlot.findUnique({ where: { code }, include: { campaign: true } });
  const now = new Date();
  const campaign = slot?.campaign;
  const active = campaign && campaign.active && campaign.startDate <= now && campaign.endDate >= now;

  if (!slot?.active || !active || !campaign) return null;

  return (
    <div className="card border-brand bg-brand/10">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Sponsored Challenge</p>
      <p className="mt-1 text-lg font-black">{campaign.name}</p>
      {campaign.ctaText && campaign.clickUrl && (
        <Link href={`/api/ad/click?campaignId=${campaign.id}`} className="cta-primary mt-3 inline-block">
          {campaign.ctaText}
        </Link>
      )}
    </div>
  );
}
