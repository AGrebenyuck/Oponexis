-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "monthKey" TEXT,
ADD COLUMN     "selectedNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
