-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER;

-- AlterTable
ALTER TABLE "RuntimeConfig" ADD COLUMN     "ragOn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "conference" TEXT,
    "section" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(512) NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeChunk_conference_idx" ON "KnowledgeChunk"("conference");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_batchId_idx" ON "KnowledgeChunk"("batchId");

-- CreateIndex (HNSW for cosine similarity search)
CREATE INDEX "KnowledgeChunk_embedding_idx" ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
