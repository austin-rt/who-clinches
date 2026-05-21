import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { chunkDocument, type FileConfig } from '@/lib/rag/chunker';
import { embedSmallBatch } from '@/lib/rag/embedding';
import { fetchSourceText, SOURCE_CONFIG, type StaticSource } from '@/lib/cfb/cfbd-static-fetcher';
import { logError } from '@/lib/errorLogger';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SOURCES: StaticSource[] = ['venues', 'conferences', 'teams', 'coaches'];

const updateSource = async (source: StaticSource) => {
  const { sourceFile } = SOURCE_CONFIG[source];
  const text = await fetchSourceText(source);

  const config: FileConfig = {
    path: sourceFile,
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/cfbd-static',
  };
  const chunks = chunkDocument(text, config);
  const embeddings = await embedSmallBatch(chunks.map((c) => c.content));
  const batchId = `cron-${source}-${Date.now()}`;

  await db.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({ where: { sourceFile } });
    for (let i = 0; i < chunks.length; i++) {
      const vectorStr = `[${embeddings[i].join(',')}]`;
      await tx.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, "sourceFile", conference, section, content, embedding, "tokenCount", "chunkIndex", "createdAt", "batchId")
        VALUES (
          ${`kc_${batchId}_${i}`},
          ${chunks[i].sourceFile},
          ${'ALL'},
          ${chunks[i].section},
          ${chunks[i].content},
          ${vectorStr}::vector,
          ${chunks[i].tokenCount},
          ${chunks[i].chunkIndex},
          NOW(),
          ${batchId}
        )
      `;
    }
  });

  return chunks.length;
};

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const singleSource = request.nextUrl.searchParams.get('source') as StaticSource | null;
  const targets = singleSource && SOURCES.includes(singleSource) ? [singleSource] : SOURCES;

  const results: Record<string, number | string> = {};
  const errors: string[] = [];

  for (const source of targets) {
    try {
      results[source] = await updateSource(source);
    } catch (err) {
      const msg = (err as Error).message;
      results[source] = `error: ${msg}`;
      errors.push(`${source}: ${msg}`);
      await logError(err, { endpoint: '/api/cron/rag-refresh', action: 'rag-cron', source });
    }
  }

  const summary = targets.map((s) => `${s}: ${results[s]} chunks`).join(', ');

  void sendEmail({
    subject: `[Cron] RAG refresh ${errors.length ? 'partial' : 'complete'}`,
    text: `${summary}${errors.length ? `\n\nErrors:\n${errors.join('\n')}` : ''}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, results });
};
