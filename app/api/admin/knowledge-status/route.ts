import { NextResponse } from 'next/server';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { db } from '@/lib/db/client';
import { redis } from '@/lib/redis';
import { getLastEmbeddingError } from '@/lib/rag/retrieval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [byConference, latestChunk, tokenUsageMonth] = await Promise.all([
    db.knowledgeChunk.groupBy({
      by: ['conference'],
      _count: true,
    }),
    db.knowledgeChunk.findFirst({
      select: { batchId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.chatMessage.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
      where: { createdAt: { gte: monthStart } },
    }),
  ]);

  const confMap: Record<string, number> = {};
  let totalChunks = 0;
  for (const row of byConference) {
    confMap[row.conference ?? 'unknown'] = row._count;
    totalChunks += row._count;
  }

  let cfbdAiUsage: Array<{ endpoint: string; calls: number }> = [];
  if (redis) {
    try {
      const raw = await redis.zrange('cfbd:ai-usage', 0, 19, { rev: true, withScores: true });
      for (let i = 0; i < raw.length; i += 2) {
        cfbdAiUsage.push({ endpoint: String(raw[i]), calls: Number(raw[i + 1]) });
      }
    } catch {
      cfbdAiUsage = [];
    }
  }

  return NextResponse.json({
    totalChunks,
    lastBatchId: latestChunk?.batchId ?? null,
    lastIngestedAt: latestChunk?.createdAt ?? null,
    byConference: confMap,
    apiKeys: {
      anthropic: { configured: !!process.env.ANTHROPIC_API_KEY },
      voyage: { configured: !!process.env.VOYAGE_API_KEY },
    },
    tokenUsage: {
      month: {
        input: tokenUsageMonth._sum.inputTokens ?? 0,
        output: tokenUsageMonth._sum.outputTokens ?? 0,
        messages: tokenUsageMonth._count,
      },
    },
    lastEmbeddingError: getLastEmbeddingError(),
    cfbdAiUsage,
  });
};
