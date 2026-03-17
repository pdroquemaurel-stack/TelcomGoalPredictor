-- CreateEnum
CREATE TYPE "BadgeCriterionType" AS ENUM ('PREDICTION_COUNT', 'CORRECT_PREDICTION_COUNT', 'EXACT_PREDICTION_COUNT');

-- AlterTable
ALTER TABLE "Badge"
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "criterionType" "BadgeCriterionType" NOT NULL DEFAULT 'PREDICTION_COUNT',
ADD COLUMN     "threshold" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "description" SET DEFAULT '';

-- Data migration
UPDATE "Badge"
SET "slug" = "code"
WHERE "slug" IS NULL;

-- Finalize constraints
ALTER TABLE "Badge"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");
CREATE INDEX "Badge_isActive_displayOrder_idx" ON "Badge"("isActive", "displayOrder");

ALTER TABLE "Badge"
DROP COLUMN "code";
