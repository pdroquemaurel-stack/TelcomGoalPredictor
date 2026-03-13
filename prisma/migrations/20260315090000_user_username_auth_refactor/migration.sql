-- Add username field for pseudo-based authentication
ALTER TABLE "User" ADD COLUMN "username" TEXT;

WITH prepared AS (
  SELECT
    id,
    lower(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9._-]', '', 'g')) AS base_username
  FROM "User"
), ranked AS (
  SELECT
    id,
    CASE
      WHEN base_username IS NULL OR base_username = '' THEN 'player'
      ELSE base_username
    END AS normalized,
    row_number() OVER (
      PARTITION BY CASE WHEN base_username IS NULL OR base_username = '' THEN 'player' ELSE base_username END
      ORDER BY id
    ) AS duplicate_rank
  FROM prepared
)
UPDATE "User" u
SET "username" = CASE
  WHEN r.duplicate_rank = 1 THEN r.normalized
  ELSE r.normalized || r.duplicate_rank
END
FROM ranked r
WHERE u.id = r.id;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
