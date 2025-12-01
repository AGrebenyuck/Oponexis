-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "invoiceEmail" VARCHAR(191),
ADD COLUMN     "invoiceNip" VARCHAR(32),
ADD COLUMN     "wantsInvoice" BOOLEAN NOT NULL DEFAULT false;
