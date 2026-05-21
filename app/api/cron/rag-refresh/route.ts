import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db/client';
import { chunkDocument, type FileConfig } from '@/lib/rag/chunker';
import { embedSmallBatch } from '@/lib/rag/embedding';
import { fetchSourceText, SOURCE_CONFIG, type StaticSource } from '@/lib/cfb/cfbd-static-fetcher';
import { logError } from '@/lib/errorLogger';
import { sendEmail } from '@/lib/email';
import { notificationHtml } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SOURCES: StaticSource[] = ['venues', 'conferences', 'teams', 'coaches'];

const hashText = (text: string) => createHash('sha256').update(text).digest('hex');

const updateSource = async (
  source: StaticSource
): Promise<{ chunks: number; skipped: boolean }> => {
  const { sourceFile } = SOURCE_CONFIG[source];
  const text = await fetchSourceText(source);

  const newHash = hashText(text);

  const existing = await db.ragSource.findUnique({ where: { source } });
  if (existing?.contentHash === newHash) {
    return { chunks: 0, skipped: true };
  }

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

  await db.ragSource.upsert({
    where: { source },
    create: { source, contentHash: newHash, chunkCount: chunks.length, updatedAt: new Date() },
    update: { contentHash: newHash, chunkCount: chunks.length, updatedAt: new Date() },
  });

  return { chunks: chunks.length, skipped: false };
};

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const singleSource = request.nextUrl.searchParams.get('source') as StaticSource | null;
  const targets = singleSource && SOURCES.includes(singleSource) ? [singleSource] : SOURCES;

  const results: Record<string, string> = {};
  const errors: string[] = [];

  for (const source of targets) {
    try {
      const { chunks, skipped } = await updateSource(source);
      results[source] = skipped ? 'unchanged' : `${chunks} chunks`;
    } catch (err) {
      const msg = (err as Error).message;
      results[source] = `error: ${msg}`;
      errors.push(`${source}: ${msg}`);
      await logError(err, { endpoint: '/api/cron/rag-refresh', action: 'rag-cron', source });
    }
  }

  const allSkipped = Object.values(results).every((v) => v === 'unchanged');

  if (!allSkipped) {
    void sendEmail({
      subject: `[Cron] RAG refresh ${errors.length ? 'partial' : 'complete'}`,
      html: notificationHtml(
        `RAG Refresh ${errors.length ? '(Partial)' : 'Complete'}`,
        targets.map((s) => ({ label: s, value: results[s] })),
        errors.length ? `Errors:\n${errors.join('\n')}` : undefined
      ),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, results });
};
