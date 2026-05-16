'use client';

import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import Navigation from './Navigation';

const Header = ({ env }: { env: 'local' | 'preview' | 'production' }) => {
  const envLabel = env === 'production' ? '' : env;
  const isNonProd = env !== 'production';

  return (
    <div className={`navbar relative shadow-lg ${isNonProd ? 'bg-env-indicator' : 'bg-base-200'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link
          href="/"
          className={`flex-1 text-xl font-bold no-underline ${isNonProd ? 'text-white' : 'text-base-content'}`}
        >
          Who Clinches{envLabel && <span className="ml-1"> - {envLabel}</span>}
        </Link>
        <div className="flex items-center gap-4">
          <Navigation isNonProd={isNonProd} />
          <DarkModeToggle isNonProd={isNonProd} />
        </div>
      </div>
    </div>
  );
};

export default Header;
