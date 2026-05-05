/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `SimulationSnapshot` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SimulationSnapshot_expiresAt_idx";

-- AlterTable
ALTER TABLE "SimulationSnapshot" DROP COLUMN "expiresAt";
