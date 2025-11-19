'use client';

import { useAppDispatch } from '../store/hooks';
import { setHideCompletedGames } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';

const HideCompletedToggle = () => {
  const dispatch = useAppDispatch();
  const { view, hideCompletedGames } = useUIState();

  const handleClick = () => {
    dispatch(setHideCompletedGames(!hideCompletedGames));
    // localStorage persistence handled by localStorageMiddleware
  };

  // Only show in picks mode
  if (view !== 'picks') {
    return null;
  }

  return (
    <button type="button" onClick={handleClick} className="btn btn-sm w-fit">
      {hideCompletedGames ? 'Show Completed Games' : 'Hide Completed Games'}
    </button>
  );
};

export default HideCompletedToggle;
