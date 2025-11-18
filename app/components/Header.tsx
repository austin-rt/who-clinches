'use client';

import DarkModeToggle from './DarkModeToggle';
import LastUpdated from './LastUpdated';
import { useUIState } from '@/app/store/useUI';

const Header = () => {
  const { mode } = useUIState();

  return (
    <div className="navbar relative bg-base-100 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1">
          <a
            className={`btn btn-ghost text-xl font-bold transition-colors ${
              mode === 'dark' ? 'text-secondary' : 'text-primary'
            }`}
          >
            SEC Tiebreaker Calculator
          </a>
        </div>
        <div className="flex items-center gap-4">
          <LastUpdated />
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};

export default Header;
