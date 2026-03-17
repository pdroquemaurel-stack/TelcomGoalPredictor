-- Add deterministic multiplier to avoid applying x2 bonus multiple times
ALTER TABLE "Prediction"
ADD COLUMN "pointsMultiplier" INTEGER NOT NULL DEFAULT 1;
