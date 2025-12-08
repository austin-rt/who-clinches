'use client';

import DarkModeToggle from './DarkModeToggle';
import ConferenceSelector from './ConferenceSelector';

const Header = () => {
  return (
    <div className="navbar relative bg-base-200 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-xl font-bold">Who Clinches</div>
        <div className="flex items-center gap-4">
          <ConferenceSelector />
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};

export default Header;
