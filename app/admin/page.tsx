'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { Input } from '@/app/components/Input';
import Divider from '@/app/components/Divider';
import { HiCheck, HiDocumentDuplicate } from 'react-icons/hi2';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { timeAgo, timeLeft, ttlLeft, shortDateTime } from '@/lib/format-time';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';

interface RuntimeConfig {
  fixtureYearOn: boolean;
  fixtureYear: number | null;
  graphqlOn: boolean;
  redisOn: boolean;
  rateLimitOn: boolean;
  inSeasonOverride: boolean;
  aiChatOn: boolean;
  ragOn: boolean;
  chatRateLimitOn: boolean;
  environment: 'local' | 'preview' | 'production';
  availableFixtureYears: number[];
  cascadeEffects?: string[];
}

interface ChatUserRow {
  id: string;
  anonymousId: string;
  email: string | null;
  purchasedCredits: number;
  freeUsedInWindow: number;
  windowExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreditStats {
  users: ChatUserRow[];
  totalDonations: number;
  totalDonationAmount: number;
  providerCooldownUntil: string | null;
}

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

interface CfbdStatus {
  remainingCalls: number | null;
  tierLimit: number | null;
  patronLevel: number | null;
  activeKeyIndex: number;
  poolSize: number;
  usage: Record<string, unknown>;
}

interface RedisKey {
  key: string;
  ttl: number;
  cachedAt: number | null;
}

interface FeedbackRow {
  id: string;
  sessionId: string | null;
  message: string;
  conf: string | null;
  vercelEnv: string | null;
  nodeEnv: string | null;
  resolved: boolean;
  createdAt: string;
}

const HAIKU_INPUT_COST_PER_MTOK = 1.0;
const HAIKU_OUTPUT_COST_PER_MTOK = 5.0;

const estimateCost = (input: number, output: number): string => {
  const cost =
    (input / 1_000_000) * HAIKU_INPUT_COST_PER_MTOK +
    (output / 1_000_000) * HAIKU_OUTPUT_COST_PER_MTOK;
  return `$${cost.toFixed(4)}`;
};

const friendlyName = (key: string): string => {
  const parts = key.split(':');
  if (parts[0] === 'ratelimit') return `Rate Limit (${parts[1]})`;
  if (parts[0] !== 'cfbd') return key;
  if (parts[1] === 'chat') {
    const endpoint = parts.slice(2, -1).join('/');
    return `Chat: /${endpoint}`;
  }
  const [, , type, ...rest] = parts;
  switch (type) {
    case 'games':
      return `${rest[0]} Games (${rest[1]} ${rest[2]})`;
    case 'teams':
      return `Teams (${rest[0]})`;
    case 'rankings':
      return `Rankings (${rest[0]} ${rest[2]})`;
    case 'sp':
      return `SP+ Ratings (${rest[0]})`;
    case 'fpi':
      return `FPI Ratings (${rest[0]})`;
    default:
      return key;
  }
};

const CopyButton = ({ text, onCopy }: { text: string; onCopy: (t: string) => void }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClick = () => {
    onCopy(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copied ? undefined : handleClick}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
        copied ? 'text-success' : 'cursor-pointer text-base-content hover:bg-base-300'
      )}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied' : 'Copy'}
      disabled={copied}
    >
      {copied ? <HiCheck className="h-3 w-3" /> : <HiDocumentDuplicate className="h-3 w-3" />}
    </button>
  );
};

const chatUserColumnHelper = createColumnHelper<ChatUserRow>();
const redisColumnHelper = createColumnHelper<RedisKey>();

export default function AdminPage() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [cfbdStatus, setCfbdStatus] = useState<CfbdStatus | null>(null);
  const [knowledgeStatus, setKnowledgeStatus] = useState<KnowledgeStatus | null>(null);
  const [creditStats, setCreditStats] = useState<CreditStats | null>(null);
  const [redisKeys, setRedisKeys] = useState<RedisKey[]>([]);
  const [redisKeyCount, setRedisKeyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [cascadeMessages, setCascadeMessages] = useState<string[]>([]);
  const [grantIdentifier, setGrantIdentifier] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [revokeIdentifier, setRevokeIdentifier] = useState('');
  const [creditActionLoading, setCreditActionLoading] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackRow[]>([]);
  const [ragSources, setRagSources] = useState<Record<
    string,
    { chunks: number; lastUpdated: string | null }
  > | null>(null);
  const [ragUpdating, setRagUpdating] = useState<Record<string, boolean>>({});

  const showMessage = useCallback((msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  }, []);

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard.writeText(text);
      showMessage('Copied');
    },
    [showMessage]
  );

  const chatUserColumns = useMemo(
    () => [
      chatUserColumnHelper.accessor('anonymousId', {
        header: 'ID',
        size: 220,
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="flex items-center gap-1">
              <span className="truncate font-mono" title={val}>
                {val}
              </span>
              <CopyButton text={val} onCopy={copyToClipboard} />
            </span>
          );
        },
      }),
      chatUserColumnHelper.accessor('email', {
        header: 'Email',
        size: 220,
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-base-content/30">—</span>;
          return (
            <span className="flex items-center gap-1">
              <span className="truncate" title={val}>
                {val}
              </span>
              <CopyButton text={val} onCopy={copyToClipboard} />
            </span>
          );
        },
      }),
      chatUserColumnHelper.accessor('purchasedCredits', { header: 'Credits' }),
      chatUserColumnHelper.accessor('freeUsedInWindow', { header: 'Free Used' }),
      chatUserColumnHelper.accessor('windowExpiresAt', {
        header: 'Free Window',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-base-content/30">—</span>;
          const d = new Date(val);
          return d > new Date() ? timeLeft(d) : 'reset';
        },
      }),
      chatUserColumnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => timeAgo(info.getValue()),
      }),
      chatUserColumnHelper.accessor('updatedAt', {
        header: 'Last Active',
        cell: (info) => timeAgo(info.getValue()),
      }),
    ],
    [copyToClipboard]
  );

  const fetchConfig = useCallback(async () => {
    const res = await fetch('/api/admin/config');
    const data = await res.json();
    setConfig(data);
    if (data.cascadeEffects?.length) {
      setCascadeMessages(data.cascadeEffects);
      setTimeout(() => setCascadeMessages([]), 5000);
    }
  }, []);

  const fetchCfbdStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cfbd-status');
      const data = await res.json();
      setCfbdStatus(data);
    } catch {
      /* CFBD status not available */
    }
  }, []);

  const fetchKnowledgeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/knowledge-status');
      const data = await res.json();
      setKnowledgeStatus(data);
    } catch {
      /* Knowledge status not available */
    }
  }, []);

  const fetchCreditStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/credit-stats');
      const data = await res.json();
      setCreditStats(data);
    } catch {
      /* Credit stats not available */
    }
  }, []);

  const fetchRedisKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/redis-keys');
      const data = await res.json();
      if (data.keys) {
        setRedisKeys(data.keys);
        setRedisKeyCount(data.count);
      }
    } catch {
      /* Redis not available */
    }
  }, []);

  const fetchRagSources = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rag-update');
      const data = await res.json();
      if (data.sources) setRagSources(data.sources);
    } catch {
      /* rag sources not available */
    }
  }, []);

  const updateRagSource = async (source: string) => {
    setRagUpdating((prev) => ({ ...prev, [source]: true }));
    try {
      const res = await fetch('/api/admin/rag-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error ?? 'Update failed');
        return;
      }
      showMessage(`${source}: ${data.chunks} chunks updated`);
      void fetchRagSources();
    } catch {
      showMessage(`${source}: update failed`);
    } finally {
      setRagUpdating((prev) => ({ ...prev, [source]: false }));
    }
  };

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      if (data.feedback) setFeedbackItems(data.feedback);
    } catch {
      /* feedback not available */
    }
  }, []);

  const deleteRedisKeys = useCallback(
    async (keys: string[]) => {
      const res = await fetch('/api/admin/redis-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      showMessage(`Deleted ${data.deletedCount} keys`);
      void fetchRedisKeys();
    },
    [showMessage, fetchRedisKeys]
  );

  const redisColumns = useMemo(
    () => [
      redisColumnHelper.accessor('key', {
        header: 'Key',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      redisColumnHelper.display({
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <span className="whitespace-nowrap">{friendlyName(info.row.original.key)}</span>
        ),
      }),
      redisColumnHelper.accessor('cachedAt', {
        header: 'Last Cached',
        cell: (info) => {
          const val = info.getValue();
          return <span className="whitespace-nowrap">{val ? timeAgo(val) : '—'}</span>;
        },
      }),
      redisColumnHelper.accessor('ttl', {
        header: 'Expires In',
        cell: (info) => <span className="whitespace-nowrap">{ttlLeft(info.getValue())}</span>,
      }),
      redisColumnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Button
            size="xs"
            color="error"
            onClick={() => void deleteRedisKeys([info.row.original.key])}
          >
            Delete
          </Button>
        ),
      }),
    ],
    [deleteRedisKeys]
  );

  const handleCreditAction = async (
    action: 'grant' | 'revoke',
    identifier: string,
    amount?: string
  ) => {
    if (!identifier.trim()) return;
    setCreditActionLoading(true);
    try {
      const res = await fetch('/api/admin/credit-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          identifier: identifier.trim(),
          amount: amount ? Number(amount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(data.error ?? 'Failed');
        return;
      }
      showMessage(
        `${action === 'grant' ? 'Granted' : 'Revoked'} ${data.credits} credits → balance: ${data.newBalance}`
      );
      void fetchCreditStats();
    } catch {
      showMessage('Request failed');
    } finally {
      setCreditActionLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchConfig(),
        fetchCfbdStatus(),
        fetchKnowledgeStatus(),
        fetchCreditStats(),
        fetchRedisKeys(),
        fetchFeedback(),
        fetchRagSources(),
      ]);
      setLoading(false);
    };
    void load();
  }, [
    fetchConfig,
    fetchCfbdStatus,
    fetchKnowledgeStatus,
    fetchCreditStats,
    fetchRedisKeys,
    fetchFeedback,
    fetchRagSources,
  ]);

  const updateConfig = async (patch: Partial<RuntimeConfig>) => {
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setConfig(data);
    if (data.cascadeEffects?.length) {
      setCascadeMessages(data.cascadeEffects);
      setTimeout(() => setCascadeMessages([]), 5000);
    }
  };

  const flushRedis = async () => {
    const res = await fetch('/api/admin/flush-redis', { method: 'POST' });
    const data = await res.json();
    showMessage(data.message ?? data.error);
    void fetchRedisKeys();
  };

  const clearDb = async (target?: string) => {
    const res = await fetch('/api/admin/clear-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    });
    const data = await res.json();
    showMessage(data.message ?? data.error);
  };

  const creditTable = useReactTable({
    data: creditStats?.users ?? [],
    columns: chatUserColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const redisTable = useReactTable({
    data: redisKeys,
    columns: redisColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isLocal = config.environment === 'local';
  const isPreview = config.environment === 'preview';

  return (
    <div className="mx-auto space-y-6 px-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {actionMessage && (
        <div className="bg-info/10 rounded-lg border border-info px-4 py-3 text-sm text-info">
          {actionMessage}
        </div>
      )}

      {cascadeMessages.length > 0 && (
        <div className="bg-warning/10 rounded-lg border border-warning px-4 py-3 text-sm text-warning">
          <p className="font-semibold">Cascade effects applied:</p>
          <ul className="mt-1 list-inside list-disc">
            {cascadeMessages.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {isLocal && (
        <Card title={config.environment}>
          <Toggle
            label="Fixture Year"
            description="Override season with fixture data (requires JSON server)"
            checked={config.fixtureYearOn}
            onChange={(v) => updateConfig({ fixtureYearOn: v })}
          />

          {config.fixtureYearOn && (
            <div className="dropdown mt-2">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-sm border border-stroke font-semibold"
              >
                {config.fixtureYear ?? config.availableFixtureYears[0] ?? 'Year'}
              </label>
              <ul className="dropdown-content menu z-[1] w-32 rounded-lg border-2 border-stroke bg-base-100 p-2 shadow-lg">
                {config.availableFixtureYears.map((year) => {
                  const selected = year === (config.fixtureYear ?? config.availableFixtureYears[0]);
                  return (
                    <li key={year}>
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          void updateConfig({ fixtureYear: year });
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                        className={cn(
                          'dropdown-close flex items-center gap-2 rounded-md py-2 pl-[calc(0.75rem+1rem+0.5rem)] pr-3 font-semibold',
                          selected && 'bg-base-200 text-primary dark:text-accent'
                        )}
                      >
                        {selected ? (
                          <HiCheck className="absolute left-3 h-4 w-4 flex-shrink-0 text-primary dark:text-accent" />
                        ) : (
                          <span className="absolute left-3 h-4 w-4" />
                        )}
                        <span>{year}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Divider className="my-4" />

          <h3 className="mb-3 font-semibold text-red-700">Danger Zone</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="md" color="error" onClick={() => clearDb('local')}>
              Clear Dev Database
            </Button>
            <Button size="md" color="error" onClick={() => clearDb('preview')}>
              Clear Preview Database
            </Button>
            <Button size="md" color="error" onClick={flushRedis}>
              Flush Redis
            </Button>
          </div>
        </Card>
      )}

      {isPreview && (
        <Card title={config.environment}>
          <h3 className="mb-3 font-semibold text-red-700">Danger Zone</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="md" color="error" onClick={() => clearDb('preview')}>
              Clear Preview Database
            </Button>
            <Button size="md" color="error" onClick={flushRedis}>
              Flush Redis
            </Button>
          </div>
        </Card>
      )}

      <Card title="Feature Toggles">
        <div className="space-y-1">
          <Toggle
            label="In-Season Override"
            description="Force in-season behavior (SSE subscriptions, short cache TTLs, GraphQL game fetching)"
            checked={config.inSeasonOverride}
            onChange={(v) => updateConfig({ inSeasonOverride: v })}
          />
          <Divider />
          <Toggle
            label="GraphQL"
            description="When off, all data fetches use REST API. Auto-enables In-Season Override when turned on outside of season"
            checked={config.graphqlOn}
            disabled={true}
            disabledReason="Not yet implemented"
            onChange={(v) => updateConfig({ graphqlOn: v })}
          />
          <Divider />
          <Toggle
            label="Redis Cache"
            description="When off, requests bypass cache. Flushed on toggle"
            checked={config.redisOn}
            disabled={config.fixtureYearOn}
            disabledReason="Disabled while fixtures are active"
            onChange={(v) => updateConfig({ redisOn: v })}
          />
          <Divider />
          <Toggle
            label="Rate Limiting"
            description="Upstash rate limiter (60 req/min)"
            checked={config.rateLimitOn}
            onChange={(v) => updateConfig({ rateLimitOn: v })}
          />
        </div>
      </Card>

      {cfbdStatus && (
        <Card title="CFBD API Status">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Stat
              label="API Calls"
              value={
                cfbdStatus.remainingCalls !== null && cfbdStatus.tierLimit !== null
                  ? `${cfbdStatus.remainingCalls.toLocaleString()} / ${cfbdStatus.tierLimit.toLocaleString()}`
                  : 'N/A'
              }
            />
            <Stat label="Patron Level" value={cfbdStatus.patronLevel ?? 'N/A'} />
            <Stat label="Active Key" value={`#${cfbdStatus.activeKeyIndex + 1}`} />
            <Stat label="Pool Size" value={cfbdStatus.poolSize} />
          </div>
        </Card>
      )}

      <Card title="AI Chat">
        <div className="space-y-1">
          <Toggle
            label="Enabled"
            description="When off, chat uses fixture responses. When on, chat calls Claude Haiku"
            checked={config.aiChatOn}
            onChange={(v) => updateConfig({ aiChatOn: v })}
          />
          <Divider />
          <Toggle
            label="RAG Context"
            description="Chat retrieves tiebreaker rule documents via vector search"
            checked={config.ragOn}
            disabled={!config.aiChatOn}
            disabledReason="Requires AI Chat to be enabled"
            onChange={(v) => updateConfig({ ragOn: v })}
          />
          <Divider />
          <Toggle
            label="Rate Limiting"
            description="Per-user 8 msg / 4 hr free window + credit system"
            checked={config.chatRateLimitOn}
            disabled={!config.aiChatOn}
            disabledReason="Requires AI Chat to be enabled"
            onChange={(v) => updateConfig({ chatRateLimitOn: v })}
          />
          <Divider />
          <Toggle
            label="CFBD Caching"
            description="Chat API lookups cached in Redis until next Saturday 11 AM ET"
            checked={config.redisOn}
            disabled={true}
            disabledReason="Follows Redis Cache toggle"
            onChange={() => {}}
          />
        </div>

        {knowledgeStatus && (
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
              <Stat
                label="Messages"
                value={knowledgeStatus.tokenUsage.month.messages.toLocaleString()}
              />
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
                value={
                  knowledgeStatus.lastIngestedAt ? timeAgo(knowledgeStatus.lastIngestedAt) : 'Never'
                }
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
              Run <code className="rounded bg-base-300 px-1">npm run ingest:knowledge</code> to
              re-ingest
            </p>
          </>
        )}

        {creditStats && (
          <>
            <Divider className="my-4" />
            <h3 className="mb-3 font-medium">Chat Credits ({creditStats.users.length} users)</h3>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
              <Stat label="Donations" value={creditStats.totalDonations} />
              <Stat
                label="Donation Total"
                value={`$${creditStats.totalDonationAmount.toFixed(2)}`}
              />
              {creditStats.providerCooldownUntil && (
                <div className="bg-warning/10 rounded px-3 py-2 text-xs text-warning">
                  Anthropic cooldown until {shortDateTime(creditStats.providerCooldownUntil)}
                </div>
              )}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  {creditTable.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} style={{ width: header.getSize() }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {creditTable.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Divider className="my-3" />

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    size="sm"
                    label="User ID or email"
                    value={grantIdentifier}
                    onChange={(e) => setGrantIdentifier(e.target.value)}
                    placeholder="778ffdda-9020-4016-91cc-13bf8edc21af"
                    className="h-9"
                  />
                </div>
                <div className="w-28">
                  <Input.Number
                    size="sm"
                    label="Credits"
                    value={grantAmount}
                    onChange={setGrantAmount}
                  />
                </div>
                <Button.Stroked
                  size="sm"
                  color="primary"
                  onClick={() => handleCreditAction('grant', grantIdentifier, grantAmount)}
                  disabled={creditActionLoading || !grantIdentifier || !grantAmount}
                >
                  Grant
                </Button.Stroked>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    size="sm"
                    label="User ID or email"
                    value={revokeIdentifier}
                    onChange={(e) => setRevokeIdentifier(e.target.value)}
                    placeholder="778ffdda-9020-4016-91cc-13bf8edc21af"
                    className="h-9"
                  />
                </div>
                <Button.Stroked
                  size="sm"
                  color="error"
                  onClick={() => handleCreditAction('revoke', revokeIdentifier)}
                  disabled={creditActionLoading || !revokeIdentifier}
                >
                  Revoke
                </Button.Stroked>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card
        title="CFBD Static Data"
        action={
          <Button.Stroked size="xs" color="primary" onClick={fetchRagSources}>
            Refresh
          </Button.Stroked>
        }
      >
        <p className="mb-3 text-xs text-base-content">
          Cron: 1st of each month (staggered 4-11 UTC). Tiebreaker rules are manual — run{' '}
          <code className="rounded bg-base-300 px-1">npm run ingest:knowledge</code>.
        </p>
        {ragSources ? (
          <div className="space-y-2">
            {Object.keys(ragSources).map((source) => {
              const info = ragSources[source];
              return (
                <div
                  key={source}
                  className="flex items-center justify-between rounded-lg border border-stroke bg-base-100 px-4 py-3"
                >
                  <div>
                    <span className="font-medium capitalize">{source}</span>
                    <span className="ml-2 text-xs text-base-content">
                      {info?.chunks ?? 0} chunks
                    </span>
                    <p className="text-base-content/50 text-xs">
                      {info?.lastUpdated
                        ? `Updated ${timeAgo(info.lastUpdated)}`
                        : 'Never ingested'}
                    </p>
                  </div>
                  <Button.Stroked
                    size="xs"
                    color="primary"
                    onClick={() => updateRagSource(source)}
                    disabled={!!ragUpdating[source]}
                  >
                    {ragUpdating[source] ? 'Updating…' : 'Update'}
                  </Button.Stroked>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-base-content">Loading…</p>
        )}
      </Card>

      <Card
        title={`Feedback (${feedbackItems.filter((f) => !f.resolved).length} open)`}
        action={
          <Button.Stroked size="xs" color="primary" onClick={fetchFeedback}>
            Refresh
          </Button.Stroked>
        }
      >
        {feedbackItems.length > 0 ? (
          <div className="space-y-3">
            {feedbackItems.map((fb) => (
              <div
                key={fb.id}
                className={cn(
                  'rounded-lg border border-stroke bg-base-100 p-3',
                  fb.resolved && 'opacity-50'
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-base-content/50 flex items-center gap-2 text-[10px]">
                    <span>{shortDateTime(fb.createdAt)}</span>
                    {fb.conf && <span className="uppercase">{fb.conf}</span>}
                    {fb.vercelEnv && (
                      <span className="rounded bg-base-200 px-1">{fb.vercelEnv}</span>
                    )}
                    {fb.sessionId && (
                      <span className="truncate font-mono" title={fb.sessionId}>
                        {fb.sessionId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      color={fb.resolved ? 'primary' : 'success'}
                      onClick={async () => {
                        await fetch('/api/admin/feedback', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: fb.id, resolved: !fb.resolved }),
                        });
                        void fetchFeedback();
                      }}
                    >
                      {fb.resolved ? 'Reopen' : 'Resolve'}
                    </Button>
                    <Button
                      size="xs"
                      color="error"
                      onClick={async () => {
                        await fetch('/api/admin/feedback', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: fb.id }),
                        });
                        void fetchFeedback();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-base-content">{fb.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content">No feedback submitted</p>
        )}
      </Card>

      <Card
        title={`Redis Cache (${redisKeyCount} keys)`}
        action={
          <Button.Stroked size="xs" color="primary" onClick={fetchRedisKeys}>
            Refresh
          </Button.Stroked>
        }
      >
        {config.fixtureYearOn && (
          <p className="mb-3 text-xs text-base-content">
            Redis is disabled while fixtures are active — cache is empty.
          </p>
        )}
        {redisKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                {redisTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {redisTable.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-base-content">No cached keys found</p>
        )}
      </Card>
    </div>
  );
}

const Card = ({
  title,
  badge,
  action,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-lg border border-stroke bg-base-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {badge}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

const Toggle = ({
  label,
  description,
  checked,
  disabled,
  disabledReason,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <span className="font-medium">{label}</span>
        <p className="text-xs text-base-content">{description}</p>
        {disabled && disabledReason && (
          <p className="text-xs text-base-content">{disabledReason}</p>
        )}
      </div>
      <label
        className={cn(
          'relative inline-flex cursor-pointer items-center',
          disabled && 'cursor-not-allowed opacity-40'
        )}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="relative h-7 w-12 rounded-full bg-base-300 transition-colors peer-checked:bg-primary dark:bg-[#555] dark:peer-checked:bg-accent">
          <div className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-base-100 shadow transition-all peer-checked:left-[calc(100%-1.625rem)]" />
        </div>
      </label>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div>
      <div className="text-xs text-base-content">{label}</div>
      <div className="text-lg font-semibold">{String(value)}</div>
    </div>
  );
};
