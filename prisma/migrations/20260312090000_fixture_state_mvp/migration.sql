-- Migrate FixtureState enum to MVP states
CREATE TYPE "FixtureState_new" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'SETTLED');

ALTER TABLE "Fixture"
  ALTER COLUMN "fixtureState" DROP DEFAULT,
  ALTER COLUMN "fixtureState" TYPE "FixtureState_new"
  USING (
    CASE "fixtureState"::text
      WHEN 'IMPORTED' THEN 'SCHEDULED'::"FixtureState_new"
      WHEN 'VISIBLE' THEN 'SCHEDULED'::"FixtureState_new"
      WHEN 'PREDICTION_ENABLED' THEN 'SCHEDULED'::"FixtureState_new"
      WHEN 'FEATURED' THEN 'LIVE'::"FixtureState_new"
      WHEN 'COMPLETED' THEN 'SETTLED'::"FixtureState_new"
      ELSE 'SCHEDULED'::"FixtureState_new"
    END
  );

DROP TYPE "FixtureState";
ALTER TYPE "FixtureState_new" RENAME TO "FixtureState";
ALTER TABLE "Fixture" ALTER COLUMN "fixtureState" SET DEFAULT 'SCHEDULED';

CREATE INDEX IF NOT EXISTS "LeaderboardSnapshot_userId_createdAt_idx"
  ON "LeaderboardSnapshot"("userId", "createdAt");
