export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-primary">SEC Tiebreaker Simulator</h1>
          <p className="text-base-content/70 text-lg">
            Tailwind CSS 3 + DaisyUI installed successfully
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card bg-primary text-primary-content shadow-lg">
            <div className="card-body">
              <h2 className="card-title">API Status</h2>
              <p>Color fields enabled in GameMetadata response</p>
              <div className="card-actions justify-end">
                <button className="btn btn-secondary">Test API</button>
              </div>
            </div>
          </div>

          <div className="card bg-secondary text-secondary-content shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Theme System</h2>
              <p>DaisyUI theme framework ready for implementation</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Configure</button>
              </div>
            </div>
          </div>

          <div className="card bg-accent text-accent-content shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Phase 0 Progress</h2>
              <p>Backend fixes complete. Frontend setup in progress.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-outline">View Details</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Teams</h2>
              <p>16 SEC teams with color data from API</p>
              <div className="card-actions justify-end">
                <button className="btn btn-ghost">View Teams</button>
              </div>
            </div>
          </div>
        </div>

        <div className="alert alert-info mt-8">
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
          <span>Tailwind CSS 3.x with DaisyUI component library is working</span>
        </div>
      </div>
    </div>
  );
}
