-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "onboardingCompleted";

-- Backfill username from email prefix or id
UPDATE "User"
SET "username" = LOWER(SPLIT_PART(COALESCE("email", ''), '@', 1))
WHERE "username" IS NULL AND COALESCE("email", '') <> '';

UPDATE "User"
SET "username" = CONCAT('player_', SUBSTRING("id" FROM 1 FOR 8))
WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
