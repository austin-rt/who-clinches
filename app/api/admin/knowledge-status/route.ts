import { NextResponse } from 'next/server';
import { isAdminAllowed } from '@/lib/admin/is-admin-allowed';
import { db } from '@/lib/db/client';
import { getLastEmbeddingError } from '@/lib/rag/retrieval';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async () => {
  if (!isAdminAllowed()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [byConference, latestChunk, tokenUsage24h, tokenUsage7d] = await Promise.all([
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
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
    db.chatMessage.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      where: { createdAt: { gte: new Date(Date.now() - 604_800_000) } },
    }),
  ]);

  const confMap: Record<string, number> = {};
  let totalChunks = 0;
  for (const row of byConference) {
    confMap[row.conference ?? 'unknown'] = row._count;
    totalChunks += row._count;
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
      last24h: {
        input: tokenUsage24h._sum.inputTokens ?? 0,
        output: tokenUsage24h._sum.outputTokens ?? 0,
      },
      last7d: {
        input: tokenUsage7d._sum.inputTokens ?? 0,
        output: tokenUsage7d._sum.outputTokens ?? 0,
      },
    },
    lastEmbeddingError: getLastEmbeddingError(),
  });
};
