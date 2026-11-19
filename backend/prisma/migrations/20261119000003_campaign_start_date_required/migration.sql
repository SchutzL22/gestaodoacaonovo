-- AlterTable
UPDATE "campaigns" SET "start_date" = "created_at" WHERE "start_date" IS NULL;
ALTER TABLE "campaigns" ALTER COLUMN "start_date" SET NOT NULL;
ALTER TABLE "campaigns" ALTER COLUMN "start_date" SET DEFAULT CURRENT_TIMESTAMP;
