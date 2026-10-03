-- Quiz completions per shop per month, for plan limits (1.0).
CREATE TABLE "Usage" (
    "shop" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("shop","month")
);
