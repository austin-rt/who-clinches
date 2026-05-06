-- CreateTable
CREATE TABLE "RuntimeConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "fixtureYearOn" BOOLEAN NOT NULL DEFAULT false,
    "fixtureYear" INTEGER,
    "graphqlOn" BOOLEAN NOT NULL DEFAULT true,
    "redisOn" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitOn" BOOLEAN NOT NULL DEFAULT true,
    "inSeasonOverride" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeConfig_pkey" PRIMARY KEY ("id")
);
