-- AlterTable
ALTER TABLE "SimulationSnapshot" ADD COLUMN "hash" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "SimulationSnapshot_hash_key" ON "SimulationSnapshot"("hash");

-- Remove default after backfill (no existing rows need backfill)
ALTER TABLE "SimulationSnapshot" ALTER COLUMN "hash" DROP DEFAULT;
