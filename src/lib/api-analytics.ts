import { prisma } from '@/lib/prisma';

export async function trackApiRequest(path: string, countryCode: string | null = null) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'API_REQUEST',
        targetType: 'API',
        targetId: path,
        metadata: countryCode ? { countryCode } : undefined,
      },
    });
  } catch {
    // Analytics tracking must never break core API flows.
  }
}
