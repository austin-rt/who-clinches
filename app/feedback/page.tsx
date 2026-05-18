'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const FeedbackPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') ?? '';
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: message.trim() || '' }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => window.close(), 2000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div className="px-4 pt-16">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-4 text-4xl">&#10003;</div>
          <h1 className="mb-2 text-xl font-bold text-base-content">Thanks!</h1>
          <p className="text-base-content/60 text-sm">
            Your feedback has been submitted. This tab will close shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-1 text-xl font-bold text-base-content">Report an Issue</h1>
        <p className="text-base-content/60 mb-4 text-sm">
          Something off with the AI chat? Let us know what happened.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What went wrong? Be as specific as you can — e.g. 'I asked about Ole Miss recruiting and it gave me 2024 data instead of 2025'"
            maxLength={2000}
            rows={5}
            className="placeholder:text-base-content/40 focus:ring-primary/50 w-full resize-none rounded-lg border-0 bg-base-200 p-3 text-sm text-base-content focus:outline-none focus:ring-2"
          />

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.close()}
              className="text-base-content/50 text-xs underline hover:text-base-content"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="hover:bg-primary/90 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
