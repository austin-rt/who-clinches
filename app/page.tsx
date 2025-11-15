export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-primary">SEC Tiebreaker Simulator</h1>
        <p className="text-base-content/70 text-lg">
          Predict game outcomes and see how they affect SEC conference standings
        </p>
      </div>

      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>Phase 0 & 1 complete. Games list and simulation features coming in Phase 2-4.</span>
      </div>
    </div>
  );
}
