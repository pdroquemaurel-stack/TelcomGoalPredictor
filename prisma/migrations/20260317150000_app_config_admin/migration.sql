-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "appName" TEXT NOT NULL DEFAULT 'Telcom Goal Predictor',
    "appTagline" TEXT NOT NULL DEFAULT 'Prédisez. Jouez. Gagnez.',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Bienvenue sur votre zone de pronostics quotidienne.',
    "homeBannerMessage" TEXT NOT NULL DEFAULT 'De nouveaux matchs arrivent chaque jour.',
    "featuredCompetitionId" TEXT,
    "showChallengesBlock" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboardBlock" BOOLEAN NOT NULL DEFAULT true,
    "showShopBlock" BOOLEAN NOT NULL DEFAULT true,
    "dailyFutureDays" INTEGER NOT NULL DEFAULT 2,
    "dailyPastDays" INTEGER NOT NULL DEFAULT 2,
    "includeLiveFixturesInDaily" BOOLEAN NOT NULL DEFAULT false,
    "maxDailyFixtures" INTEGER NOT NULL DEFAULT 200,
    "dailyAutoUseEnabledCompetitions" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT NOT NULL DEFAULT '#ff7900',
    "secondaryColor" TEXT NOT NULL DEFAULT '#000000',
    "ctaColor" TEXT NOT NULL DEFAULT '#ff7900',
    "backgroundColor" TEXT NOT NULL DEFAULT '#000000',
    "cardColor" TEXT NOT NULL DEFAULT '#09090b',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_singletonKey_key" ON "AppConfig"("singletonKey");

-- CreateIndex
CREATE INDEX "AppConfig_featuredCompetitionId_idx" ON "AppConfig"("featuredCompetitionId");

-- AddForeignKey
ALTER TABLE "AppConfig" ADD CONSTRAINT "AppConfig_featuredCompetitionId_fkey" FOREIGN KEY ("featuredCompetitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
