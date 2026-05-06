'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { Select } from '@/app/components/Select';
import Divider from '@/app/components/Divider';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface RuntimeConfig {
  fixtureYearOn: boolean;
  fixtureYear: number | null;
  graphqlOn: boolean;
  redisOn: boolean;
  rateLimitOn: boolean;
  inSeasonOverride: boolean;
  environment: 'local' | 'preview' | 'production';
  availableFixtureYears: number[];
  cascadeEffects?: string[];
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

const formatRelativeTime = (timestamp: number): string => {
  const totalMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (totalMinutes < 1) return 'just now';
  const units: [number, string][] = [
    [525960, 'y'],
    [43830, 'mo'],
    [1440, 'd'],
    [1, 'm'],
  ];
  const parts: string[] = [];
  let remaining = totalMinutes;
  for (const [size, label] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      parts.push(`${count}${label}`);
      remaining -= count * size;
    }
  }
  return `${parts.join(' ')} ago`;
};

const formatExpiresIn = (ttlSeconds: number): string => {
  if (ttlSeconds < 0) return 'never';
  let remaining = Math.floor(ttlSeconds / 60);
  const units: [number, string][] = [
    [525960, 'y'],
    [43830, 'mo'],
    [1440, 'd'],
    [60, 'h'],
    [1, 'm'],
  ];
  const parts: string[] = [];
  for (const [size, label] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      parts.push(`${count}${label}`);
      remaining -= count * size;
    }
  }
  return parts.length ? parts.join(' ') : '<1m';
};

export default function AdminPage() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [cfbdStatus, setCfbdStatus] = useState<CfbdStatus | null>(null);
  const [redisKeys, setRedisKeys] = useState<RedisKey[]>([]);
  const [redisKeyCount, setRedisKeyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [cascadeMessages, setCascadeMessages] = useState<string[]>([]);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

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

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchConfig(), fetchCfbdStatus(), fetchRedisKeys()]);
      setLoading(false);
    };
    void load();
  }, [fetchConfig, fetchCfbdStatus, fetchRedisKeys]);

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

  const deleteRedisKeys = async (keys: string[]) => {
    const res = await fetch('/api/admin/redis-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    const data = await res.json();
    showMessage(`Deleted ${data.deletedCount} keys`);
    void fetchRedisKeys();
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <span
          className={cn(
            'rounded-lg border-2 px-3 py-1 text-sm font-semibold',
            isLocal && 'border-success text-success',
            isPreview && 'border-warning text-warning',
            !isLocal && !isPreview && 'border-neutral text-neutral'
          )}
        >
          {isLocal ? 'Local Dev' : config.environment}
        </span>
      </div>

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

      {/* Local Section */}
      {isLocal && (
        <Card title="Local Dev">
          <Toggle
            label="Fixture Year"
            description="Override season with fixture data (requires JSON server)"
            checked={config.fixtureYearOn}
            onChange={(v) => updateConfig({ fixtureYearOn: v })}
          />

          {config.fixtureYearOn && (
            <Select.Stroked
              size="sm"
              color="primary"
              className="mt-2 w-full max-w-xs"
              value={config.fixtureYear ?? ''}
              onChange={(e) =>
                updateConfig({ fixtureYear: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="" disabled>
                Select year
              </option>
              {config.availableFixtureYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select.Stroked>
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

      {/* Preview Section */}
      {isPreview && (
        <Card title="Preview">
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

      {/* Feature Toggles */}
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

      {/* CFBD API Status */}
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

      {/* Redis Cache Inspector */}
      <Card
        title={`Redis Cache (${redisKeyCount} keys)`}
        action={
          <Button.Stroked size="xs" color="primary" onClick={fetchRedisKeys}>
            Refresh
          </Button.Stroked>
        }
      >
        {config.fixtureYearOn && (
          <p className="mb-3 text-xs text-text-secondary">
            Redis is disabled while fixtures are active — cache is empty.
          </p>
        )}
        {redisKeys.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Name</th>
                  <th>Last Cached</th>
                  <th>Expires In</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {redisKeys.map((entry) => (
                  <tr key={entry.key}>
                    <td className="font-mono text-xs">{entry.key}</td>
                    <td className="whitespace-nowrap">{friendlyName(entry.key)}</td>
                    <td className="whitespace-nowrap text-text-secondary">
                      {entry.cachedAt ? formatRelativeTime(entry.cachedAt) : '—'}
                    </td>
                    <td className="whitespace-nowrap text-text-secondary">
                      {formatExpiresIn(entry.ttl)}
                    </td>
                    <td>
                      <Button size="xs" color="error" onClick={() => deleteRedisKeys([entry.key])}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No cached keys found</p>
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
        <p className="text-xs text-text-secondary">{description}</p>
        {disabled && disabledReason && (
          <p className="text-xs text-text-secondary">{disabledReason}</p>
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
        <div
          className={cn(
            'relative h-7 w-12 rounded-full bg-base-300 transition-colors',
            'peer-checked:bg-primary dark:peer-checked:bg-accent'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-6 w-6 rounded-full bg-base-100 shadow transition-all',
              checked ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
            )}
          />
        </div>
      </label>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div>
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="text-lg font-semibold">{String(value)}</div>
    </div>
  );
};
