import { prisma } from '@/lib/prisma';

export const APP_CONFIG_DEFAULTS = {
  appName: 'Telcom Goal Predictor',
  appTagline: 'Prédisez. Jouez. Gagnez.',
  welcomeMessage: 'Bienvenue sur votre zone de pronostics quotidienne.',
  homeBannerMessage: 'De nouveaux matchs arrivent chaque jour.',
  featuredCompetitionId: null as string | null,
  showChallengesBlock: true,
  showLeaderboardBlock: true,
  showShopBlock: true,
  dailyFutureDays: 2,
  dailyPastDays: 2,
  includeLiveFixturesInDaily: false,
  maxDailyFixtures: 200,
  dailyAutoUseEnabledCompetitions: true,
  primaryColor: '#ff7900',
  secondaryColor: '#000000',
  ctaColor: '#ff7900',
  backgroundColor: '#000000',
  cardColor: '#09090b',
  textColor: '#ffffff',
  logoUrl: null as string | null,
};

export async function getAppConfig() {
  const config = await prisma.appConfig.findUnique({ where: { singletonKey: 'default' } });
  if (!config) return APP_CONFIG_DEFAULTS;

  return {
    ...APP_CONFIG_DEFAULTS,
    ...config,
  };
}

export async function ensureAppConfig() {
  return prisma.appConfig.upsert({
    where: { singletonKey: 'default' },
    create: { singletonKey: 'default' },
    update: {},
  });
}
