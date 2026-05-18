'use client';

import Link from 'next/link';

const ErrorPage = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
    <h2 className="text-2xl font-bold text-base-content">Something went wrong</h2>
    <p className="text-base-content/60 max-w-md text-sm">
      An unexpected error occurred. Try refreshing the page or going back.
    </p>
    <div className="flex gap-3">
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
      >
        Try again
      </button>
      <Link
        href="/"
        className="rounded-lg border border-base-300 px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
      >
        Go home
      </Link>
    </div>
  </div>
);

export default ErrorPage;
