'use client';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { setHideCompletedGames } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';

const HideCompletedToggle = () => {
  const { view } = useUIState();
  const [hideCompletedGames, setHideCompletedGamesValue] = useLocalStorage<boolean>(
    'sec-tiebreaker-hide-completed',
    false,
    setHideCompletedGames,
    (state) => state.ui.hideCompletedGames
  );

  const handleClick = () => {
    setHideCompletedGamesValue(!hideCompletedGames);
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
