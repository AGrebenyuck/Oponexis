-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "serviceNameIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
