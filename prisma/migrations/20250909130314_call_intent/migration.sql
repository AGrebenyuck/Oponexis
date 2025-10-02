-- CreateTable
CREATE TABLE "CallIntent" (
    "id" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "visitorId" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallIntent_partnerCode_createdAt_idx" ON "CallIntent"("partnerCode", "createdAt");
