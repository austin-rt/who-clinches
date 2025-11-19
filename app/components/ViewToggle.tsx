'use client';

import { BsTrophy } from 'react-icons/bs';
import { MdOutlineScoreboard } from 'react-icons/md';
import { useAppDispatch } from '../store/hooks';
import { setView } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';

const ViewToggle = () => {
  const dispatch = useAppDispatch();
  const { mode, view } = useUIState();

  const handleClick = () => {
    const newView = view === 'picks' ? 'scores' : 'picks';
    dispatch(setView(newView));
    // localStorage persistence handled by localStorageMiddleware
  };

  // Determine icon colors based on mode (same pattern as DarkModeToggle)
  const iconColorClass = mode === 'dark' ? 'text-secondary' : 'text-primary';

  return (
    <button
      type="button"
      onClick={handleClick}
      className="swap swap-rotate relative flex items-center gap-2"
    >
      {/* Pick Winners - shown in scores mode */}
      <div
        className={`flex items-center gap-2 ${view === 'scores' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <BsTrophy className={`h-8 w-8 fill-current ${iconColorClass}`} />
        <span className={`text-sm font-medium ${iconColorClass}`}>Pick Winners</span>
      </div>
      {/* Enter Scores - shown in picks mode */}
      <div
        className={`flex items-center gap-2 ${view === 'picks' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <MdOutlineScoreboard className={`h-8 w-8 fill-current ${iconColorClass}`} />
        <span className={`text-sm font-medium ${iconColorClass}`}>Enter Scores</span>
      </div>
    </button>
  );
};

export default ViewToggle;
