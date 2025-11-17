'use client';

import DarkModeToggle from './DarkModeToggle';

const Header = () => {
  return (
    <div className="navbar relative bg-base-100 shadow-lg">
      <div className="container mx-auto">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl font-bold text-primary">SEC Tiebreaker Calculator</a>
        </div>
      </div>
      <div className="absolute right-2 top-2 md:right-4 md:top-4">
        <DarkModeToggle />
      </div>
    </div>
  );
};

export default Header;
