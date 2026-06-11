-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PROMO', 'REGULAR');

-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "tier" "PlanTier" NOT NULL DEFAULT 'REGULAR';

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "freePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "promoPeriodDays" INTEGER NOT NULL DEFAULT 90,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
