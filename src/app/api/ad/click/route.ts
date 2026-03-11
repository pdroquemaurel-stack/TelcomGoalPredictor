export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  if (!campaignId) return NextResponse.redirect(new URL('/', req.url));
  const campaign = await prisma.sponsorCampaign.update({ where: { id: campaignId }, data: { clicks: { increment: 1 } } });
  return NextResponse.redirect(campaign.clickUrl || '/');
}
