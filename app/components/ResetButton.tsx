'use client';

import { cn } from '@/lib/utils';
import { useAppDispatch } from '../store/hooks';
import { clearAllPicks } from '../store/gamePicksSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

interface ResetButtonProps {
  onReset?: () => void;
  className?: string;
}

const ResetButton = ({ onReset, className }: ResetButtonProps) => {
  const dispatch = useAppDispatch();
  const { view } = useUIState();

  const handleClick = () => {
    dispatch(clearAllPicks());
    if (onReset) {
      onReset();
    }
  };

  return (
    <Button.Stroked
      size="md"
      color="primary"
      onClick={handleClick}
      className={cn('text-xs', className)}
    >
      {view === 'picks' ? 'Reset Picks' : 'Reset Scores'}
    </Button.Stroked>
  );
};

export default ResetButton;
