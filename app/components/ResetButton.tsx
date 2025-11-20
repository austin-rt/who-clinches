'use client';

import { useAppDispatch } from '../store/hooks';
import { clearAllPicks } from '../store/gamePicksSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

const ResetButton = () => {
  const dispatch = useAppDispatch();
  const { view, mode } = useUIState();

  const handleClick = () => {
    dispatch(clearAllPicks());
  };

  const buttonText = view === 'picks' ? 'Reset Picks' : 'Reset Scores';

  return (
    <Button.Stroked
      size="sm"
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleClick}
      className="w-fit"
    >
      {buttonText}
    </Button.Stroked>
  );
};

export default ResetButton;

