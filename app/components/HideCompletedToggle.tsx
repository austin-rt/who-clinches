'use client';

import { useAppDispatch } from '../store/hooks';
import { setHideCompletedGames } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

const HideCompletedToggle = () => {
  const dispatch = useAppDispatch();
  const { hideCompletedGames, mode } = useUIState();

  const handleClick = () => {
    dispatch(setHideCompletedGames(!hideCompletedGames));
  };

  return (
    <Button.Stroked
      size="sm"
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleClick}
      className="w-fit"
    >
      {hideCompletedGames ? 'Show Completed Games' : 'Hide Completed Games'}
    </Button.Stroked>
  );
};

export default HideCompletedToggle;
