-- CreateTable
CREATE TABLE "ChallengeCompetition" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeCompetition_pkey" PRIMARY KEY ("id")
);

-- Migrate existing Challenge.competitionId values
INSERT INTO "ChallengeCompetition" ("id", "challengeId", "competitionId", "createdAt")
SELECT CONCAT('cc_', "id", '_', "competitionId"), "id", "competitionId", CURRENT_TIMESTAMP FROM "Challenge";

ALTER TABLE "Challenge" DROP CONSTRAINT "Challenge_competitionId_fkey";
DROP INDEX "Challenge_competitionId_idx";
ALTER TABLE "Challenge" DROP COLUMN "competitionId";

CREATE UNIQUE INDEX "ChallengeCompetition_challengeId_competitionId_key" ON "ChallengeCompetition"("challengeId", "competitionId");
CREATE INDEX "ChallengeCompetition_competitionId_idx" ON "ChallengeCompetition"("competitionId");

ALTER TABLE "ChallengeCompetition" ADD CONSTRAINT "ChallengeCompetition_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeCompetition" ADD CONSTRAINT "ChallengeCompetition_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
