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
    <div className="card bg-yellow-50">
      <p className="text-xs uppercase text-slate-500">Sponsored</p>
      <p className="font-semibold">{campaign.name}</p>
      {campaign.ctaText && campaign.clickUrl && (
        <Link href={`/api/ad/click?campaignId=${campaign.id}`} className="text-sm text-brand underline">
          {campaign.ctaText}
        </Link>
      )}
    </div>
  );
}
