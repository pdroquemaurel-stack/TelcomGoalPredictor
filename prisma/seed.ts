import { CompetitionType, FixtureState, PrismaClient, UserRole } from '@prisma/client';
import { normalizeTeamNameToLogoFile } from '@/lib/team-logo';
import { hash } from 'bcryptjs';
import { settleFinishedFixtures } from '@/lib/services/settlement-service';

const prisma = new PrismaClient();

async function resolveAvailableFriendCode(baseCode: string) {
  let candidate = baseCode;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { friendCode: candidate }, select: { id: true } })) {
    candidate = `${baseCode}${String(suffix).padStart(2, '0')}`;
    suffix += 1;
  }

  return candidate;
}

async function main() {
  const users = [
    { username: 'admin', password: 'admin123!', role: UserRole.ADMIN, friendCode: 'ADMIN001', displayName: 'Demo Admin' },
    { username: 'joueur1', password: 'joueur1', role: UserRole.PLAYER, friendCode: 'PLAY001', displayName: 'Joueur 1' },
    { username: 'joueur2', password: 'joueur2', role: UserRole.PLAYER, friendCode: 'PLAY002', displayName: 'Joueur 2' },
    { username: 'player', password: 'player', role: UserRole.PLAYER, friendCode: 'PLAY003', displayName: 'Demo Player' },
  ];

  const seededUsers: Array<{ id: string; username: string }> = [];

  for (const entry of users) {
    const passwordHash = await hash(entry.password, 10);
    const existingByUsername = await prisma.user.findUnique({ where: { username: entry.username }, select: { id: true } });

    const user = await prisma.user.upsert({
      where: { username: entry.username },
      update: {
        role: entry.role,
        passwordHash,
      },
      create: {
        username: entry.username,
        email: `${entry.username}@demo.local`,
        role: entry.role,
        friendCode: existingByUsername ? entry.friendCode : await resolveAvailableFriendCode(entry.friendCode),
        passwordHash,
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { displayName: entry.displayName, acceptedTerms: true },
      create: { userId: user.id, displayName: entry.displayName, acceptedTerms: true },
    });

    seededUsers.push({ id: user.id, username: user.username });
  }

  const competition = await prisma.competition.upsert({
    where: { externalId: 'wc2026-demo' },
    update: { name: 'World Cup 2026 Demo', code: 'WC2026', type: CompetitionType.NATIONAL, active: true, visible: true },
    create: { externalId: 'wc2026-demo', name: 'World Cup 2026 Demo', code: 'WC2026', type: CompetitionType.NATIONAL, active: true, visible: true },
  });

  const teamNames = ['Senegal', 'Nigeria', 'Morocco', 'Egypt', 'Ghana', 'Cameroon'];
  const teamIds = new Map<string, string>();

  for (const teamName of teamNames) {
    const team = await prisma.team.upsert({
      where: { externalId: `demo-${teamName.toLowerCase()}` },
      update: { name: teamName, logoUrl: `/teams/${normalizeTeamNameToLogoFile(teamName)}.png` },
      create: { externalId: `demo-${teamName.toLowerCase()}`, name: teamName, logoUrl: `/teams/${normalizeTeamNameToLogoFile(teamName)}.png` },
    });
    teamIds.set(teamName, team.id);
  }

  const now = Date.now();
  const fixtures = [
    { externalId: 'demo-fix-1', home: 'Senegal', away: 'Nigeria', kickoff: new Date(now - 3 * 86400000), statusText: 'FINISHED', state: FixtureState.FINISHED, homeScore: 2, awayScore: 1 },
    { externalId: 'demo-fix-2', home: 'Morocco', away: 'Egypt', kickoff: new Date(now - 2 * 86400000), statusText: 'FINISHED', state: FixtureState.FINISHED, homeScore: 1, awayScore: 1 },
    { externalId: 'demo-fix-3', home: 'Ghana', away: 'Cameroon', kickoff: new Date(now + 1 * 86400000), statusText: 'SCHEDULED', state: FixtureState.SCHEDULED, homeScore: null, awayScore: null },
    { externalId: 'demo-fix-4', home: 'Senegal', away: 'Morocco', kickoff: new Date(now + 2 * 86400000), statusText: 'SCHEDULED', state: FixtureState.SCHEDULED, homeScore: null, awayScore: null },
  ];

  const createdFixtures: Array<{ id: string; externalId: string }> = [];

  for (const fixture of fixtures) {
    const row = await prisma.fixture.upsert({
      where: { externalId: fixture.externalId },
      update: {
        competitionId: competition.id,
        homeTeamId: teamIds.get(fixture.home)!,
        awayTeamId: teamIds.get(fixture.away)!,
        utcKickoff: fixture.kickoff,
        statusText: fixture.statusText,
        fixtureState: fixture.state,
        predictionEnabled: fixture.state === FixtureState.SCHEDULED,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
      },
      create: {
        externalId: fixture.externalId,
        competitionId: competition.id,
        homeTeamId: teamIds.get(fixture.home)!,
        awayTeamId: teamIds.get(fixture.away)!,
        utcKickoff: fixture.kickoff,
        statusText: fixture.statusText,
        fixtureState: fixture.state,
        predictionEnabled: fixture.state === FixtureState.SCHEDULED,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
      },
    });

    createdFixtures.push({ id: row.id, externalId: row.externalId });
  }

  const playerUsers = seededUsers.filter((user) => user.username !== 'admin');

  for (const player of playerUsers) {
    for (const fixture of createdFixtures) {
      const samplePrediction = fixture.externalId.endsWith('1')
        ? { homeScore: 2, awayScore: 1 }
        : fixture.externalId.endsWith('2')
          ? { homeScore: 0, awayScore: 0 }
          : { homeScore: 1, awayScore: 0 };

      await prisma.prediction.upsert({
        where: { userId_fixtureId: { userId: player.id, fixtureId: fixture.id } },
        update: samplePrediction,
        create: { userId: player.id, fixtureId: fixture.id, ...samplePrediction },
      });
    }
  }

  await settleFinishedFixtures(prisma);

  console.log('Seed complete. Admin: admin / admin | Players: joueur1 / joueur1, joueur2 / joueur2');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
