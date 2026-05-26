'use client';

import { HiSun, HiMoon } from 'react-icons/hi2';
import { useUIState } from '@/app/store/useUI';

const DarkModeToggle = ({ isNonProd }: { isNonProd: boolean }) => {
  const { mode, setMode } = useUIState();

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.checked ? 'dark' : 'light');
  };

  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={mode === 'dark'}
        onChange={handleToggle}
      />
      <div
        className={`relative h-8 w-16 rounded-full transition-colors ${isNonProd ? 'bg-white/30' : 'bg-base-300 dark:bg-accent-content'}`}
      >
        <HiSun
          className={`absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${isNonProd ? 'text-white' : 'text-base-content dark:text-accent'}`}
        />
        <HiMoon
          className={`absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${isNonProd ? 'text-white' : 'text-primary dark:text-accent'}`}
        />
        <div
          className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full shadow transition-all ${
            mode === 'dark'
              ? 'left-[calc(100%-0.25rem-0.625rem-0.875rem)] bg-base-100'
              : 'left-0 bg-base-100'
          }`}
        >
          <div className="flex h-full w-full items-center justify-center">
            {mode === 'dark' ? (
              <HiMoon className="h-4 w-4 text-accent" />
            ) : (
              <HiSun className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
      </div>
    </label>
  );
};

export default DarkModeToggle;
