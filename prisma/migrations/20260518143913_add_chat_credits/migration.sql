-- AlterTable
ALTER TABLE "RuntimeConfig" ADD COLUMN     "chatRateLimitOn" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ChatUser" (
    "id" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "email" TEXT,
    "purchasedCredits" INTEGER NOT NULL DEFAULT 0,
    "freeUsedInWindow" INTEGER NOT NULL DEFAULT 0,
    "windowExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "bmcId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "credits" INTEGER NOT NULL,
    "chatUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatUser_anonymousId_key" ON "ChatUser"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatUser_email_key" ON "ChatUser"("email");

-- CreateIndex
CREATE INDEX "ChatUser_email_idx" ON "ChatUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_bmcId_key" ON "Donation"("bmcId");

-- CreateIndex
CREATE INDEX "Donation_email_idx" ON "Donation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");
