import { PrismaClient, UserRole, FixtureState } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function computePoints(predHome: number, predAway: number, realHome: number, realAway: number) {
  if (predHome === realHome && predAway === realAway) return 3;
  const pred = predHome === predAway ? 'D' : predHome > predAway ? 'H' : 'A';
  const real = realHome === realAway ? 'D' : realHome > realAway ? 'H' : 'A';
  return pred === real ? 1 : 0;
}

async function main() {
  const adminPass = await hash('Admin123!', 10);
  const playerPass = await hash('Player123!', 10);

  const usersSeed = [
    { email: 'admin@demo.com', role: UserRole.ADMIN, friendCode: 'ADMIN001', displayName: 'Demo Admin' },
    { email: 'player@demo.com', role: UserRole.PLAYER, friendCode: 'PLAY001', displayName: 'Demo Player' },
    { email: 'amina@demo.com', role: UserRole.PLAYER, friendCode: 'PLAY002', displayName: 'Amina' },
    { email: 'koffi@demo.com', role: UserRole.PLAYER, friendCode: 'PLAY003', displayName: 'Koffi' },
    { email: 'samir@demo.com', role: UserRole.PLAYER, friendCode: 'PLAY004', displayName: 'Samir' },
  ];

  const users = [] as Array<{ id: string; email: string; displayName: string }>;

  for (const seed of usersSeed) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { passwordHash: seed.role === UserRole.ADMIN ? adminPass : playerPass, role: seed.role },
      create: {
        email: seed.email,
        passwordHash: seed.role === UserRole.ADMIN ? adminPass : playerPass,
        role: seed.role,
        friendCode: seed.friendCode,
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { displayName: seed.displayName, acceptedTerms: true },
      create: { userId: user.id, displayName: seed.displayName, acceptedTerms: true, favoriteClub: 'World Cup Fan' },
    });

    users.push({ id: user.id, email: user.email, displayName: seed.displayName });
  }

  const competitionsData = [
    { externalId: 'wc2026', name: 'World Cup 2026', code: 'WC2026', displayOrder: 0 },
    { externalId: 'cafcl', name: 'CAF Champions League', code: 'CAFCL', displayOrder: 1 },
    { externalId: 'ucl', name: 'Champions League', code: 'UCL', displayOrder: 2 },
  ];

  const competitions = new Map<string, string>();
  for (const comp of competitionsData) {
    const competition = await prisma.competition.upsert({
      where: { externalId: comp.externalId },
      update: { name: comp.name, code: comp.code, active: true, visible: true, displayOrder: comp.displayOrder },
      create: { externalId: comp.externalId, name: comp.name, code: comp.code, active: true, visible: true, displayOrder: comp.displayOrder },
    });
    competitions.set(comp.code, competition.id);
  }

  const teamNames = [
    'Senegal', 'Nigeria', 'Morocco', 'Egypt', 'Brazil', 'France', 'Germany', 'Argentina',
    'Al Ahly', 'Wydad AC', 'Mamelodi Sundowns', 'Esperance', 'Real Madrid', 'Barcelona', 'Manchester City', 'Bayern Munich',
  ];

  const teams = new Map<string, string>();
  for (const name of teamNames) {
    const key = `seed-team-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const team = await prisma.team.upsert({
      where: { externalId: key },
      update: { name },
      create: { externalId: key, name },
    });
    teams.set(name, team.id);
  }

  const now = Date.now();
  const fixtureSeeds = [
    ['wc-1', 'WC2026', 'Senegal', 'Nigeria', now - 4 * 86400000, 2, 1],
    ['wc-2', 'WC2026', 'Morocco', 'Egypt', now - 3 * 86400000, 1, 1],
    ['wc-3', 'WC2026', 'Brazil', 'France', now - 2 * 86400000, 0, 2],
    ['wc-4', 'WC2026', 'Germany', 'Argentina', now + 1 * 86400000, null, null],
    ['wc-5', 'WC2026', 'Senegal', 'Brazil', now + 2 * 86400000, null, null],
    ['wc-6', 'WC2026', 'France', 'Nigeria', now + 3 * 86400000, null, null],
    ['caf-1', 'CAFCL', 'Al Ahly', 'Wydad AC', now - 2 * 86400000, 1, 0],
    ['caf-2', 'CAFCL', 'Mamelodi Sundowns', 'Esperance', now + 1 * 86400000, null, null],
    ['ucl-1', 'UCL', 'Real Madrid', 'Manchester City', now - 1 * 86400000, 2, 2],
    ['ucl-2', 'UCL', 'Barcelona', 'Bayern Munich', now + 2 * 86400000, null, null],
  ] as const;

  const fixtures = [] as Array<{ id: string; externalId: string; realHome: number | null; realAway: number | null }>;

  for (const [externalId, code, home, away, kickoffMs, homeScore, awayScore] of fixtureSeeds) {
    const isCompleted = homeScore !== null && awayScore !== null;
    const fixture = await prisma.fixture.upsert({
      where: { externalId },
      update: {
        competitionId: competitions.get(code)!,
        homeTeamId: teams.get(home)!,
        awayTeamId: teams.get(away)!,
        utcKickoff: new Date(kickoffMs),
        statusText: isCompleted ? 'FINISHED' : 'SCHEDULED',
        predictionEnabled: true,
        fixtureState: isCompleted ? FixtureState.COMPLETED : FixtureState.PREDICTION_ENABLED,
        homeScore,
        awayScore,
        visible: true,
      },
      create: {
        externalId,
        competitionId: competitions.get(code)!,
        homeTeamId: teams.get(home)!,
        awayTeamId: teams.get(away)!,
        utcKickoff: new Date(kickoffMs),
        statusText: isCompleted ? 'FINISHED' : 'SCHEDULED',
        predictionEnabled: true,
        fixtureState: isCompleted ? FixtureState.COMPLETED : FixtureState.PREDICTION_ENABLED,
        homeScore,
        awayScore,
        visible: true,
      },
    });
    fixtures.push({ id: fixture.id, externalId, realHome: homeScore, realAway: awayScore });
  }

  for (const user of users.filter((u) => u.email !== 'admin@demo.com')) {
    for (const fixture of fixtures) {
      const isPast = fixture.realHome !== null && fixture.realAway !== null;
      const shouldPredict = Math.random() > 0.2 || isPast;
      if (!shouldPredict) continue;

      const homeScore = isPast ? Math.max(0, (fixture.realHome ?? 0) + (Math.floor(Math.random() * 3) - 1)) : Math.floor(Math.random() * 4);
      const awayScore = isPast ? Math.max(0, (fixture.realAway ?? 0) + (Math.floor(Math.random() * 3) - 1)) : Math.floor(Math.random() * 4);

      await prisma.prediction.upsert({
        where: { userId_fixtureId: { userId: user.id, fixtureId: fixture.id } },
        update: { homeScore, awayScore },
        create: { userId: user.id, fixtureId: fixture.id, homeScore, awayScore },
      });
    }
  }

  for (const user of users) {
    const predictions = await prisma.prediction.findMany({ where: { userId: user.id }, include: { fixture: true } });
    const totalPredictions = predictions.length;
    const exactHits = predictions.filter((prediction) => prediction.fixture.homeScore === prediction.homeScore && prediction.fixture.awayScore === prediction.awayScore).length;

    const settled = predictions.filter((prediction) => prediction.fixture.homeScore !== null && prediction.fixture.awayScore !== null);
    const totalPoints = settled.reduce((sum, prediction) => sum + computePoints(
      prediction.homeScore,
      prediction.awayScore,
      prediction.fixture.homeScore ?? 0,
      prediction.fixture.awayScore ?? 0,
    ), 0);

    const accuracyPct = totalPredictions === 0 ? 0 : Math.round((exactHits / totalPredictions) * 100);

    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        totalPredictions,
        exactHits,
        totalPoints,
        accuracyPct,
        currentStreak: Math.min(totalPredictions, 4),
        bestStreak: Math.min(totalPredictions + 1, 6),
        level: totalPoints > 8 ? 'Pro' : 'Rookie',
      },
    });
  }

  console.log('Seed complete. Admin: admin@demo.com / Admin123! | Player: player@demo.com / Player123!');
}

main().finally(() => prisma.$disconnect());
