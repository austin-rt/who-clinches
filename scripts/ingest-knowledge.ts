import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { chunkDocument, FILE_CONFIGS } from '../lib/rag/chunker';
import { embedDocuments } from '../lib/rag/embedding';

const DOCS_BASE = join(process.cwd(), 'docs', 'tiebreaker-rules', 'cleaned');

const parseDatabaseUrl = (): string | undefined => {
  const idx = process.argv.indexOf('--database-url');
  if (idx === -1 || !process.argv[idx + 1]) return undefined;
  return process.argv[idx + 1];
};

const createClient = (): PrismaClient => {
  const databaseUrl = parseDatabaseUrl();
  if (databaseUrl) {
    return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  }
  return new PrismaClient();
};

const run = async () => {
  const db = createClient();
  const batchId = `ingest-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

  console.log(`Batch: ${batchId}`);
  console.log(`Reading ${FILE_CONFIGS.length} source files...\n`);

  const allChunks: Array<{
    content: string;
    sourceFile: string;
    conference: string;
    section: string;
    chunkIndex: number;
    tokenCount: number;
  }> = [];

  for (const config of FILE_CONFIGS) {
    const baseDir = config.baseDir ? join(process.cwd(), config.baseDir) : DOCS_BASE;
    const filePath = join(baseDir, config.path);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const chunks = chunkDocument(content, config);
      allChunks.push(
        ...chunks.map((c) => ({
          ...c,
          conference: config.conference,
        }))
      );
      console.log(`  ${config.conference.padEnd(5)} ${config.path} → ${chunks.length} chunks`);
    } catch (err) {
      console.error(`  SKIP  ${config.path}: ${(err as Error).message}`);
    }
  }

  console.log(`\nTotal chunks: ${allChunks.length}`);
  console.log(`Embedding via Voyage AI...\n`);

  const texts = allChunks.map((c) => c.content);
  const embeddings = await embedDocuments(texts);

  console.log(
    `Received ${embeddings.length} embeddings (${embeddings[0]?.length ?? 0} dimensions)\n`
  );
  console.log(`Inserting into KnowledgeChunk table...`);

  let inserted = 0;
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const vectorStr = `[${embeddings[i].join(',')}]`;

    await db.$executeRaw`
      INSERT INTO "KnowledgeChunk" (id, "sourceFile", conference, section, content, embedding, "tokenCount", "chunkIndex", "createdAt", "batchId")
      VALUES (
        ${`kc_${batchId}_${i}`},
        ${chunk.sourceFile},
        ${chunk.conference},
        ${chunk.section},
        ${chunk.content},
        ${vectorStr}::vector,
        ${chunk.tokenCount},
        ${chunk.chunkIndex},
        NOW(),
        ${batchId}
      )
    `;
    inserted++;

    if (inserted % 25 === 0) {
      console.log(`  ${inserted}/${allChunks.length} inserted`);
    }
  }

  console.log(`  ${inserted}/${allChunks.length} inserted\n`);

  const deleted = await db.knowledgeChunk.deleteMany({
    where: { batchId: { not: batchId } },
  });
  console.log(`Deleted ${deleted.count} chunks from previous batches`);

  const stats = await db.knowledgeChunk.groupBy({
    by: ['conference'],
    _count: true,
    where: { batchId },
  });

  console.log(`\n--- Summary ---`);
  for (const row of stats) {
    console.log(`  ${(row.conference ?? 'null').padEnd(5)} ${row._count} chunks`);
  }
  console.log(`  Total: ${inserted} chunks`);

  await db.$disconnect();
};

run().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
