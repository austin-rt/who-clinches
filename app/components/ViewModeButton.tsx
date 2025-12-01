'use client';

import { BsTrophy } from 'react-icons/bs';
import { MdOutlineScoreboard } from 'react-icons/md';
import { useAppDispatch } from '../store/hooks';
import { setView } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

const ViewModeButton = () => {
  const dispatch = useAppDispatch();
  const { view, mode } = useUIState();

  const handleClick = () => {
    const newView = view === 'picks' ? 'scores' : 'picks';
    dispatch(setView(newView));
  };

  return (
    <Button.Stroked
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleClick}
      className="group swap swap-rotate relative w-full sm:w-fit"
    >
      <div
        className={`flex items-center gap-2 transition-colors ${view === 'scores' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <BsTrophy className="h-5 w-5 fill-current" />
        <span className="text-xs font-semibold">Make Picks</span>
      </div>
      <div
        className={`flex items-center gap-2 transition-colors ${view === 'picks' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <MdOutlineScoreboard className="h-6 w-6 fill-current" />
        <span className="text-xs font-semibold">Enter Scores</span>
      </div>
    </Button.Stroked>
  );
};

export default ViewModeButton;
