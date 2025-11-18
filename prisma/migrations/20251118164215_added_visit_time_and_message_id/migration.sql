-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "telegramMessageId" INTEGER,
ADD COLUMN     "visitDate" TIMESTAMP(3),
ADD COLUMN     "visitTime" TEXT;
