-- CreateTable
CREATE TABLE "GoogleReviewsCache" (
    "id" TEXT NOT NULL DEFAULT 'google',
    "payload" JSONB NOT NULL,
    "rating" DOUBLE PRECISION,
    "total" INTEGER,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleReviewsCache_pkey" PRIMARY KEY ("id")
);
