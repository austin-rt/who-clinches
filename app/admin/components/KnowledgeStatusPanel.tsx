'use client';

import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format-time';
import { Divider } from '@/app/components/Common';

interface KnowledgeStatus {
  totalChunks: number;
  lastBatchId: string | null;
  lastIngestedAt: string | null;
  byConference: Record<string, number>;
  apiKeys: {
    anthropic: { configured: boolean };
    voyage: { configured: boolean };
  };
  tokenUsage: {
    month: { input: number; output: number; messages: number };
  };
  lastEmbeddingError: { timestamp: string; message: string } | null;
  cfbdAiUsage: Array<{ endpoint: string; calls: number }>;
}

const HAIKU_INPUT_COST_PER_MTOK = 1.0;
const HAIKU_OUTPUT_COST_PER_MTOK = 5.0;

const estimateCost = (input: number, output: number): string => {
  const cost =
    (input / 1_000_000) * HAIKU_INPUT_COST_PER_MTOK +
    (output / 1_000_000) * HAIKU_OUTPUT_COST_PER_MTOK;
  return `$${cost.toFixed(4)}`;
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <div className="text-xs text-base-content">{label}</div>
    <div className="text-lg font-semibold">{String(value)}</div>
  </div>
);

export default function KnowledgeStatusPanel({
  knowledgeStatus,
}: {
  knowledgeStatus: KnowledgeStatus;
}) {
  return (
    <>
      <Divider className="my-4" />
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-medium">Anthropic</h3>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            knowledgeStatus.apiKeys.anthropic.configured
              ? 'bg-success/20 text-success'
              : 'bg-error/20 text-error'
          )}
        >
          {knowledgeStatus.apiKeys.anthropic.configured ? 'Key Configured' : 'Key Missing'}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <Stat label="Messages" value={knowledgeStatus.tokenUsage.month.messages.toLocaleString()} />
        <Stat
          label="Input Tokens"
          value={knowledgeStatus.tokenUsage.month.input.toLocaleString()}
        />
        <Stat
          label="Output Tokens"
          value={knowledgeStatus.tokenUsage.month.output.toLocaleString()}
        />
        <Stat
          label="Est. Cost"
          value={estimateCost(
            knowledgeStatus.tokenUsage.month.input,
            knowledgeStatus.tokenUsage.month.output
          )}
        />
      </div>

      <Divider className="my-3" />

      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-medium">Voyage AI (Embeddings)</h3>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            knowledgeStatus.apiKeys.voyage.configured
              ? 'bg-success/20 text-success'
              : 'bg-error/20 text-error'
          )}
        >
          {knowledgeStatus.apiKeys.voyage.configured ? 'Key Configured' : 'Key Missing'}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <Stat label="Total Chunks" value={knowledgeStatus.totalChunks} />
        <Stat
          label="Last Ingested"
          value={knowledgeStatus.lastIngestedAt ? timeAgo(knowledgeStatus.lastIngestedAt) : 'Never'}
        />
        <Stat label="Batch" value={knowledgeStatus.lastBatchId?.slice(0, 20) ?? 'None'} />
        <Stat label="Conferences" value={Object.keys(knowledgeStatus.byConference).length} />
      </div>
      {Object.keys(knowledgeStatus.byConference).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(knowledgeStatus.byConference)
            .sort(([, a], [, b]) => b - a)
            .map(([conf, count]) => (
              <span
                key={conf}
                className="rounded-full bg-base-300 px-2.5 py-0.5 text-xs font-medium"
              >
                {conf} ({count})
              </span>
            ))}
        </div>
      )}
      {knowledgeStatus.lastEmbeddingError && (
        <div className="bg-error/10 mt-3 rounded px-3 py-2 text-xs text-error">
          Embedding error: {knowledgeStatus.lastEmbeddingError.message}
        </div>
      )}
      {knowledgeStatus.cfbdAiUsage?.length > 0 && (
        <>
          <Divider className="my-3" />
          <h3 className="mb-2 font-medium">CFBD AI Endpoint Usage</h3>
          <div className="space-y-1">
            {knowledgeStatus.cfbdAiUsage.map((u) => (
              <div key={u.endpoint} className="flex items-center justify-between text-xs">
                <span className="font-mono">{u.endpoint}</span>
                <span className="font-semibold">{u.calls}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="mt-3 text-xs text-base-content">
        Run <code className="rounded bg-base-300 px-1">npm run ingest:knowledge</code> to re-ingest
      </p>
    </>
  );
}
