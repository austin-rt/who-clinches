import { Prisma } from '@prisma/client';
import { db } from '@/lib/db/client';
import { embedQuery } from './embedding';

export interface RetrievedChunk {
  id: string;
  content: string;
  conference: string | null;
  section: string | null;
  sourceFile: string;
  chunkIndex: number;
  similarity: number;
}

const MIN_SIMILARITY = 0.3;
const DEFAULT_TOP_K = 5;
const MIN_CONFERENCE_RESULTS = 2;

let lastEmbeddingError: { timestamp: Date; message: string } | null = null;
export const getLastEmbeddingError = () => lastEmbeddingError;

export const retrieveRelevantChunks = async (
  query: string,
  conference: string | null,
  topK = DEFAULT_TOP_K
): Promise<RetrievedChunk[]> => {
  try {
    const vector = await embedQuery(query);
    const vectorStr = `[${vector.join(',')}]`;

    lastEmbeddingError = null;

    const search = async (conf: string | null): Promise<RetrievedChunk[]> => {
      const results = await db.$queryRaw<RetrievedChunk[]>(
        conf
          ? Prisma.sql`
              SELECT id, content, conference, section, "sourceFile", "chunkIndex",
                     1 - (embedding <=> ${vectorStr}::vector) AS similarity
              FROM "KnowledgeChunk"
              WHERE conference = ${conf} OR conference = 'ALL'
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT ${topK}
            `
          : Prisma.sql`
              SELECT id, content, conference, section, "sourceFile", "chunkIndex",
                     1 - (embedding <=> ${vectorStr}::vector) AS similarity
              FROM "KnowledgeChunk"
              ORDER BY embedding <=> ${vectorStr}::vector
              LIMIT ${topK}
            `
      );

      return results.filter((r) => r.similarity >= MIN_SIMILARITY);
    };

    let chunks = await search(conference);

    if (conference && chunks.length < MIN_CONFERENCE_RESULTS) {
      chunks = await search(null);
    }

    return chunks;
  } catch (err) {
    lastEmbeddingError = {
      timestamp: new Date(),
      message: (err as Error).message,
    };
    return [];
  }
};
