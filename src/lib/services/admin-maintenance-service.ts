import { prisma } from '@/lib/prisma';

export async function purgeCompetitionData() {
  return prisma.$transaction(async (tx) => {
    const predictionsDeleted = await tx.prediction.deleteMany();
    const challengeFixturesDeleted = await tx.challengeFixture.deleteMany();
    const challengesDeleted = await tx.challenge.deleteMany();
    const fixturesDeleted = await tx.fixture.deleteMany();
    const competitionsDeleted = await tx.competition.deleteMany();
    const teamsDeleted = await tx.team.deleteMany();

    return {
      predictionsDeleted: predictionsDeleted.count,
      challengeFixturesDeleted: challengeFixturesDeleted.count,
      challengesDeleted: challengesDeleted.count,
      fixturesDeleted: fixturesDeleted.count,
      competitionsDeleted: competitionsDeleted.count,
      teamsDeleted: teamsDeleted.count,
    };
  });
}
