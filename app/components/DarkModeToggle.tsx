'use client';

import { HiSun, HiMoon } from 'react-icons/hi2';
import { useUIState } from '@/app/store/useUI';

const DarkModeToggle = () => {
  const { mode, setMode } = useUIState();

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = e.target.checked ? 'dark' : 'light';
    setMode(newMode);
  };

  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={mode === 'dark'}
        onChange={handleToggle}
      />
      {/* Toggle track with both icons visible */}
      <div className="relative h-8 w-[3.75rem] rounded-full bg-base-300 transition-colors peer-checked:bg-primary">
        {/* Sun icon - left side */}
        <HiSun className="absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content" />
        {/* Moon icon - right side */}
        <HiMoon className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 text-base-content" />
        {/* Toggle circle with active icon inside */}
        <div
          className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-base-100 shadow transition-all ${
            mode === 'dark' ? 'left-[calc(100%-0.25rem-0.625rem-0.875rem)]' : 'left-0'
          }`}
        >
          {/* Active icon inside circle */}
          <div className="flex h-full w-full items-center justify-center">
            {mode === 'dark' ? (
              <HiMoon className="h-4 w-4 text-primary" />
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
