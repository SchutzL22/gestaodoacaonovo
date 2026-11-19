-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'FUTURE', 'CLOSED');

-- AlterTable: add new columns to users
ALTER TABLE "users"
  ADD COLUMN "matricula" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "semester_hours_limit" DOUBLE PRECISION,
  ADD COLUMN "total_hours_earned" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex: unique constraint for matricula
CREATE UNIQUE INDEX "users_matricula_key" ON "users"("matricula");

-- CreateIndex: index for matricula
CREATE INDEX "users_matricula_idx" ON "users"("matricula");

-- CreateTable: campaigns
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "hours_limit" DOUBLE PRECISION,
    "conversion_rules" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable: priority_items
CREATE TABLE "priority_items" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" DOUBLE PRECISION,
    "urgency_level" TEXT NOT NULL DEFAULT 'NORMAL',
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "priority_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add new columns to donations
ALTER TABLE "donations"
  ADD COLUMN "campaign_id" TEXT,
  ADD COLUMN "received_by_id" TEXT,
  ADD COLUMN "donor_name" TEXT,
  ADD COLUMN "donor_cpf" TEXT,
  ADD COLUMN "observation" TEXT;

-- CreateIndex: index for donations.campaign_id
CREATE INDEX "donations_campaign_id_idx" ON "donations"("campaign_id");

-- CreateIndex: index for donations.received_by_id
CREATE INDEX "donations_received_by_id_idx" ON "donations"("received_by_id");

-- CreateTable: password_reset_tokens
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint for password_reset_tokens.token
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex: index for password_reset_tokens.token
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex: index for password_reset_tokens.user_id
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- AddForeignKey: priority_items -> campaigns
ALTER TABLE "priority_items" ADD CONSTRAINT "priority_items_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: donations -> campaigns
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: donations -> users (received_by)
ALTER TABLE "donations" ADD CONSTRAINT "donations_received_by_id_fkey"
  FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: password_reset_tokens -> users
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
