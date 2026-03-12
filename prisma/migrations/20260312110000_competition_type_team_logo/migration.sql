-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('NATIONAL', 'CLUB');

-- AlterTable
ALTER TABLE "Competition"
ADD COLUMN "type" "CompetitionType" NOT NULL DEFAULT 'CLUB';

-- AlterTable
ALTER TABLE "Team"
ADD COLUMN "logoUrl" TEXT;
