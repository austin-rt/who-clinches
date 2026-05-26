'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { shortDateTime } from '@/lib/format-time';

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

export default function FeedbackPanel() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackRow[]>([]);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      if (data.feedback) setFeedbackItems(data.feedback);
    } catch {
      /* feedback not available */
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/feedback')
      .then((res) => res.json())
      .then((data) => {
        if (data.feedback) setFeedbackItems(data.feedback);
      })
      .catch(() => {});
  }, []);

  const toggleResolved = async (fb: FeedbackRow) => {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fb.id, resolved: !fb.resolved }),
    });
    void fetchFeedback();
  };

  const deleteFeedback = async (fb: FeedbackRow) => {
    await fetch('/api/admin/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fb.id }),
    });
    void fetchFeedback();
  };

  const openCount = feedbackItems.filter((f) => !f.resolved).length;

  return (
    <Card
      title={`Feedback (${openCount} open)`}
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
                  {fb.vercelEnv && <span className="rounded bg-base-200 px-1">{fb.vercelEnv}</span>}
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
                    onClick={() => toggleResolved(fb)}
                  >
                    {fb.resolved ? 'Reopen' : 'Resolve'}
                  </Button>
                  <Button size="xs" color="error" onClick={() => deleteFeedback(fb)}>
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
