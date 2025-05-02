-- DropForeignKey
ALTER TABLE "AdditionalServices" DROP CONSTRAINT "AdditionalServices_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "AdditionalServices" ADD CONSTRAINT "AdditionalServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
