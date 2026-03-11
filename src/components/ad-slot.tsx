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
    <div className="card border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <p className="text-xs uppercase tracking-wide text-amber-700">Sponsored challenge</p>
      <p className="mt-1 font-semibold text-amber-950">{campaign.name}</p>
      {campaign.ctaText && campaign.clickUrl && (
        <Link href={`/api/ad/click?campaignId=${campaign.id}`} className="mt-2 inline-block text-sm font-semibold text-amber-900 underline">
          {campaign.ctaText}
        </Link>
      )}
    </div>
  );
}
