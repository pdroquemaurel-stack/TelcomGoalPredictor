import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { canSubmitPrediction } from '@/lib/services/prediction-rules';
import { getSessionUserId } from '@/lib/auth-session';
import { assignBadgesForUser } from '@/lib/services/badge-service';
import { trackApiRequest } from '@/lib/api-analytics';
import { calculatePredictionActivityStreak, isDoublePointsStreakActive } from '@/lib/profile-streak';


const schema = z.object({
  fixtureId: z.string().min(1),
  homeScore: z.number().min(0).max(20),
  awayScore: z.number().min(0).max(20),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getSessionUserId(session);
    if (!userId) return apiError('UNAUTHORIZED', 'Authentication required.', 401);

    const profile = await prisma.profile.findUnique({ where: { userId }, include: { country: true } });
    await trackApiRequest('/api/predictions', profile?.country?.code ?? null);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid prediction payload.', 400, parsed.error.flatten());
    }

    const fixture = await prisma.fixture.findUnique({ where: { id: parsed.data.fixtureId } });
    if (!fixture || !fixture.visible) {
      return apiError('NOT_FOUND', 'Fixture not found.', 404);
    }

    if (!canSubmitPrediction(fixture.fixtureState, fixture.predictionEnabled, fixture.utcKickoff)) {
      return apiError('PREDICTION_LOCKED', 'Predictions are locked for this fixture.', 400, {
        fixtureState: fixture.fixtureState,
        kickoff: fixture.utcKickoff,
      });
    }

    const activityPredictions = await prisma.prediction.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    const activityStreak = calculatePredictionActivityStreak([
      ...activityPredictions.map((prediction) => prediction.createdAt),
      new Date(),
    ]);
    const pointsMultiplier = isDoublePointsStreakActive(activityStreak) ? 2 : 1;

    const prediction = await prisma.prediction.upsert({
      where: { userId_fixtureId: { userId, fixtureId: fixture.id } },
      create: {
        userId,
        fixtureId: fixture.id,
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        pointsMultiplier,
      },
      update: {
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        pointsMultiplier,
      },
    });

    await assignBadgesForUser(userId, prisma);

    return apiSuccess({ prediction });
  } catch (error) {
    return apiError('INTERNAL_ERROR', 'Failed to save prediction.', 500, error instanceof Error ? error.message : error);
  }
}
