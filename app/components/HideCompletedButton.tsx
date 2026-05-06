'use client';

import { useAppDispatch } from '../store/hooks';
import { setHideCompletedGames } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

const HideCompletedButton = () => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames } = useUIState();

  const handleClick = () => {
    dispatch(setHideCompletedGames(!hideCompletedGames));
  };

  return (
    <Button.Stroked size="sm" color="primary" onClick={handleClick} className="w-fit text-xs">
      <span>
        <span>
          {hideCompletedGames ? 'Show Completed' : 'Hide Completed'}{' '}
          <span className="hidden sm:inline"> Games</span>
        </span>
      </span>
    </Button.Stroked>
  );
};

export default HideCompletedButton;
