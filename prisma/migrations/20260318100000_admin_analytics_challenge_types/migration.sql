CREATE TYPE "ChallengeType" AS ENUM ('RANKING', 'COMPLETION');
CREATE TYPE "ChallengeCompletionMode" AS ENUM ('CORRECT', 'EXACT');

ALTER TABLE "Challenge"
ADD COLUMN "challengeType" "ChallengeType" NOT NULL DEFAULT 'RANKING',
ADD COLUMN "completionMode" "ChallengeCompletionMode",
ADD COLUMN "completionTarget" INTEGER;

CREATE TABLE "LoginActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LoginActivity"
ADD CONSTRAINT "LoginActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LoginActivity_createdAt_idx" ON "LoginActivity"("createdAt");
CREATE INDEX "LoginActivity_userId_createdAt_idx" ON "LoginActivity"("userId", "createdAt");
