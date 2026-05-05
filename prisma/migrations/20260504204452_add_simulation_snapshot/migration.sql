-- CreateTable
CREATE TABLE "SimulationSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sport" TEXT NOT NULL,
    "conf" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "SimulationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimulationSnapshot_expiresAt_idx" ON "SimulationSnapshot"("expiresAt");
