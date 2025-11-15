'use client';

export function Header() {
  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="container mx-auto">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl font-bold text-primary">SEC Tiebreaker</a>
        </div>
        <div className="flex-none">
          {/* Theme selector placeholder - will be implemented in Phase 5 */}
          <div className="text-base-content/70 text-sm">Theme Selector (Phase 5)</div>
        </div>
      </div>
    </div>
  );
}
