'use client';

import DarkModeToggle from './DarkModeToggle';
import Navigation from './Navigation';

const Header = ({ env }: { env: 'local' | 'preview' | 'production' }) => {
  const envLabel = env === 'production' ? '' : env;
  const isNonProd = env !== 'production';

  return (
    <div
      className={`navbar relative shadow-lg ${isNonProd ? 'bg-env-indicator text-white' : 'bg-base-200'}`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-xl font-bold">
          {envLabel && <span className="mr-1">{envLabel} -</span>}
          Who Clinches
        </div>
        <div className="flex items-center gap-4">
          <Navigation />
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};

export default Header;
