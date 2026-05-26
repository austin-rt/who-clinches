'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/app/components/Button';
import { timeAgo } from '@/lib/format-time';

type RagSources = Record<string, { chunks: number; lastUpdated: string | null }>;

export default function RagSourcesPanel({ showMessage }: { showMessage: (msg: string) => void }) {
  const [ragSources, setRagSources] = useState<RagSources | null>(null);
  const [ragUpdating, setRagUpdating] = useState<Record<string, boolean>>({});

  const fetchRagSources = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rag-update');
      const data = await res.json();
      if (data.sources) setRagSources(data.sources);
    } catch {
      /* rag sources not available */
    }
  }, []);

  useEffect(() => {
    void fetchRagSources();
  }, [fetchRagSources]);

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

  return (
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
                  <span className="ml-2 text-xs text-base-content">{info?.chunks ?? 0} chunks</span>
                  <p className="text-base-content/50 text-xs">
                    {info?.lastUpdated ? `Updated ${timeAgo(info.lastUpdated)}` : 'Never ingested'}
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
  );
}

const Card = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-stroke bg-base-200 p-5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);
