'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { Divider, LoadingSpinner } from '@/app/components/Common';
import { HiCheck } from 'react-icons/hi2';
import { timeAgo, ttlLeft } from '@/lib/format-time';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import KnowledgeStatusPanel from './components/KnowledgeStatusPanel';
import ChatCreditsPanel, { type CreditStats } from './components/ChatCreditsPanel';
import RagSourcesPanel from './components/RagSourcesPanel';
import FeedbackPanel from './components/FeedbackPanel';

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

  const showMessage = useCallback((msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  }, []);

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

  const redisTable = useReactTable({
    data: redisKeys,
    columns: redisColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchConfig(),
        fetchCfbdStatus(),
        fetchKnowledgeStatus(),
        fetchCreditStats(),
        fetchRedisKeys(),
      ]);
      setLoading(false);
    };
    void load();
  }, [fetchConfig, fetchCfbdStatus, fetchKnowledgeStatus, fetchCreditStats, fetchRedisKeys]);

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

        {knowledgeStatus && <KnowledgeStatusPanel knowledgeStatus={knowledgeStatus} />}

        {creditStats && (
          <ChatCreditsPanel
            creditStats={creditStats}
            onRefresh={fetchCreditStats}
            showMessage={showMessage}
          />
        )}
      </Card>

      <RagSourcesPanel showMessage={showMessage} />

      <FeedbackPanel />

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
