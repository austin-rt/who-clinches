import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { db } from '@/lib/db/client';
import { redis } from '@/lib/redis';
import { chunkDocument, type FileConfig } from '@/lib/rag/chunker';
import { embedSmallBatch } from '@/lib/rag/embedding';
import { fetchSourceText, SOURCE_CONFIG, type StaticSource } from '@/lib/cfb/cfbd-static-fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HASH_PREFIX = 'rag:hash';
const VALID_SOURCES = Object.keys(SOURCE_CONFIG) as StaticSource[];

const updateSource = async (source: StaticSource, force = false) => {
  const { sourceFile } = SOURCE_CONFIG[source];
  const text = await fetchSourceText(source);

  const newHash = createHash('sha256').update(text).digest('hex');
  const hashKey = `${HASH_PREFIX}:${source}`;

  if (!force && redis) {
    const storedHash = await redis.get<string>(hashKey);
    if (storedHash === newHash) {
      return { source, chunks: 0, skipped: true };
    }
  }

  const config: FileConfig = {
    path: sourceFile,
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/cfbd-static',
  };
  const chunks = chunkDocument(text, config);

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedSmallBatch(texts);

  const batchId = `rag-update-${source}-${Date.now()}`;

  await db.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({ where: { sourceFile } });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vectorStr = `[${embeddings[i].join(',')}]`;
      await tx.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, "sourceFile", conference, section, content, embedding, "tokenCount", "chunkIndex", "createdAt", "batchId")
        VALUES (
          ${`kc_${batchId}_${i}`},
          ${chunk.sourceFile},
          ${'ALL'},
          ${chunk.section},
          ${chunk.content},
          ${vectorStr}::vector,
          ${chunk.tokenCount},
          ${chunk.chunkIndex},
          NOW(),
          ${batchId}
        )
      `;
    }
  });

  if (redis) await redis.set(hashKey, newHash);

  return { source, chunks: chunks.length, skipped: false };
};

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stats = await db.knowledgeChunk.groupBy({
    by: ['sourceFile'],
    _count: true,
    _max: { createdAt: true },
    where: { sourceFile: { in: VALID_SOURCES.map((s) => SOURCE_CONFIG[s].sourceFile) } },
  });

  const sources: Record<string, { chunks: number; lastUpdated: string | null }> = {};
  for (const s of VALID_SOURCES) {
    const row = stats.find((r) => r.sourceFile === SOURCE_CONFIG[s].sourceFile);
    sources[s] = {
      chunks: row?._count ?? 0,
      lastUpdated: row?._max.createdAt?.toISOString() ?? null,
    };
  }

  return NextResponse.json({ sources });
};

export const POST = async (request: NextRequest) => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const source = body.source as string;

  if (!VALID_SOURCES.includes(source as StaticSource)) {
    return NextResponse.json(
      { error: `Invalid source. Valid: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    );
  }

  const force = body.force === true;

  try {
    const result = await updateSource(source as StaticSource, force);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
};
