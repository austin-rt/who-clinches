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
    <label className="swap swap-rotate">
      {/* Hidden checkbox controls the state */}
      <input type="checkbox" checked={mode === 'dark'} onChange={handleToggle} />
      {/* Sun icon - shown in dark mode (swap-on) - uses SEC Gold (secondary) */}
      <HiSun className="swap-on h-8 w-8 fill-current text-secondary" />
      {/* Moon icon - shown in light mode (swap-off) - uses SEC Blue (primary) */}
      <HiMoon className="swap-off h-8 w-8 fill-current text-primary" />
    </label>
  );
};

export default DarkModeToggle;
