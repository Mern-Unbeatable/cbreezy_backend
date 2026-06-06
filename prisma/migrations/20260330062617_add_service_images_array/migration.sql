-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "serviceImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
