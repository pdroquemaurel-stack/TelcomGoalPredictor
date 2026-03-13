-- Ensure Challenge -> ChallengeCompetition normalization is applied after
-- Challenge creation migrations in all environments.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Challenge'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ChallengeCompetition'
  ) THEN
    CREATE TABLE "ChallengeCompetition" (
        "id" TEXT NOT NULL,
        "challengeId" TEXT NOT NULL,
        "competitionId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChallengeCompetition_pkey" PRIMARY KEY ("id")
    );
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS "ChallengeCompetition_challengeId_competitionId_key"
    ON "ChallengeCompetition"("challengeId", "competitionId");
  CREATE INDEX IF NOT EXISTS "ChallengeCompetition_competitionId_idx"
    ON "ChallengeCompetition"("competitionId");

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Challenge' AND column_name = 'competitionId'
  ) THEN
    INSERT INTO "ChallengeCompetition" ("id", "challengeId", "competitionId", "createdAt")
    SELECT CONCAT('cc_', c."id", '_', c."competitionId"), c."id", c."competitionId", CURRENT_TIMESTAMP
    FROM "Challenge" c
    ON CONFLICT ("challengeId", "competitionId") DO NOTHING;

    ALTER TABLE "Challenge" DROP CONSTRAINT IF EXISTS "Challenge_competitionId_fkey";
    DROP INDEX IF EXISTS "Challenge_competitionId_idx";
    ALTER TABLE "Challenge" DROP COLUMN IF EXISTS "competitionId";
  END IF;

  ALTER TABLE "ChallengeCompetition"
    ADD CONSTRAINT "ChallengeCompetition_challengeId_fkey"
    FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Competition'
  ) THEN
    ALTER TABLE "ChallengeCompetition"
      ADD CONSTRAINT "ChallengeCompetition_competitionId_fkey"
      FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
