-- CreateTable
CREATE TABLE "RagSource" (
    "source" TEXT NOT NULL,
    "contentHash" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "RagSource_pkey" PRIMARY KEY ("source")
);
