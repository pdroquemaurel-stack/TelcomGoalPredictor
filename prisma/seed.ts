import { PrismaClient, AdSlotCode, CampaignType, ProductType, UserRole, FixtureState } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await hash('Admin123!', 10);
  const playerPass = await hash('Player123!', 10);

  const [sn, ng] = await Promise.all([
    prisma.country.upsert({ where: { code: 'SN' }, update: {}, create: { code: 'SN', name: 'Senegal' } }),
    prisma.country.upsert({ where: { code: 'NG' }, update: {}, create: { code: 'NG', name: 'Nigeria' } }),
  ]);

  const [dakar, lagos] = await Promise.all([
    prisma.city.upsert({ where: { name_countryId: { name: 'Dakar', countryId: sn.id } }, update: {}, create: { name: 'Dakar', countryId: sn.id } }),
    prisma.city.upsert({ where: { name_countryId: { name: 'Lagos', countryId: ng.id } }, update: {}, create: { name: 'Lagos', countryId: ng.id } }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { passwordHash: adminPass, role: UserRole.ADMIN },
    create: { email: 'admin@demo.com', passwordHash: adminPass, role: UserRole.ADMIN, friendCode: 'ADMIN001' },
  });

  const player = await prisma.user.upsert({
    where: { email: 'player@demo.com' },
    update: { passwordHash: playerPass },
    create: { email: 'player@demo.com', passwordHash: playerPass, friendCode: 'PLAY001' },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, displayName: 'Demo Admin', acceptedTerms: true, countryId: sn.id, cityId: dakar.id, favoriteClub: 'ASC Jaraaf' },
  });
  await prisma.profile.upsert({
    where: { userId: player.id },
    update: {},
    create: { userId: player.id, displayName: 'Demo Player', acceptedTerms: true, countryId: ng.id, cityId: lagos.id, favoriteClub: 'Enyimba FC' },
  });

  await prisma.adminUserRole.upsert({ where: { userId_role: { userId: admin.id, role: UserRole.ADMIN } }, update: {}, create: { userId: admin.id, role: UserRole.ADMIN } });

  const comp = await prisma.competition.upsert({ where: { externalId: '2001' }, update: { name: 'CAF Champions League', code: 'CAFCL' }, create: { externalId: '2001', name: 'CAF Champions League', code: 'CAFCL' } });
  const t1 = await prisma.team.upsert({ where: { externalId: '1001' }, update: {}, create: { externalId: '1001', name: 'Al Ahly' } });
  const t2 = await prisma.team.upsert({ where: { externalId: '1002' }, update: {}, create: { externalId: '1002', name: 'Wydad AC' } });
  const t3 = await prisma.team.upsert({ where: { externalId: '1003' }, update: {}, create: { externalId: '1003', name: 'Mamelodi Sundowns' } });

  const kickoff1 = new Date(Date.now() + 24 * 3600 * 1000);
  const kickoff2 = new Date(Date.now() - 48 * 3600 * 1000);

  await prisma.fixture.upsert({
    where: { externalId: '5001' },
    update: {},
    create: { externalId: '5001', competitionId: comp.id, homeTeamId: t1.id, awayTeamId: t2.id, utcKickoff: kickoff1, statusText: 'SCHEDULED', predictionEnabled: true, featured: true, fixtureState: FixtureState.PREDICTION_ENABLED },
  });

  await prisma.fixture.upsert({
    where: { externalId: '5002' },
    update: {},
    create: { externalId: '5002', competitionId: comp.id, homeTeamId: t3.id, awayTeamId: t1.id, utcKickoff: kickoff2, statusText: 'FINISHED', homeScore: 2, awayScore: 1, fixtureState: FixtureState.COMPLETED },
  });

  const campaign = await prisma.sponsorCampaign.create({
    data: {
      type: CampaignType.BANNER,
      name: 'Orange Goal Challenge',
      sponsorBrand: 'Orange',
      ctaText: 'Join challenge',
      clickUrl: 'https://www.orange.com',
      targetCountryId: sn.id,
      targetCompetitionId: comp.id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 15 * 86400000),
      active: true,
      priority: 10,
    },
  });

  for (const [code, name] of [
    [AdSlotCode.HOME_TOP_BANNER, 'Home top banner'],
    [AdSlotCode.INLINE_PREDICTIONS, 'Inline predictions'],
    [AdSlotCode.LEADERBOARD_SPONSOR, 'Leaderboard sponsor'],
    [AdSlotCode.RESULT_PAGE_SPONSOR, 'Result page sponsor'],
    [AdSlotCode.SHOP_SPONSOR, 'Shop sponsor'],
  ] as const) {
    await prisma.adSlot.upsert({ where: { code }, update: { campaignId: campaign.id }, create: { code, name, campaignId: campaign.id } });
  }

  await prisma.product.createMany({
    data: [
      { type: ProductType.DOUBLE_POINTS_TOKEN, name: 'Double Points Token', description: 'Double your points for one fixture.', price: 1.99, currency: 'USD', entitlementRules: 'one_fixture_boost' },
      { type: ProductType.PREDICTION_SHIELD, name: 'Prediction Shield', description: 'Protect one wrong prediction streak.', price: 0.99, currency: 'USD', entitlementRules: 'one_streak_protect' },
      { type: ProductType.PROFILE_COSMETIC, name: 'Premium Avatar Frame', description: 'Gold profile frame cosmetic.', price: 0.5, currency: 'USD', entitlementRules: 'cosmetic_frame' },
      { type: ProductType.SPONSORED_BONUS, name: 'Sponsored Reward Pack', description: 'Operator sponsored free pack.', price: 0, currency: 'USD', sponsored: true, entitlementRules: 'sponsor_pack' },
    ],
    skipDuplicates: true,
  });

  await prisma.themeConfig.create({ data: { operatorName: 'Demo Telecom', logoUrl: 'https://placehold.co/200x60?text=Demo+Telecom' } });

  console.log('Seed complete. Admin: admin@demo.com / Admin123! | Player: player@demo.com / Player123!');
}

main().finally(() => prisma.$disconnect());
