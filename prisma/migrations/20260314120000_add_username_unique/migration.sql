ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
