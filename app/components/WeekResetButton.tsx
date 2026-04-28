'use client';

import { cn } from '@/lib/utils';
import { GameLean } from '@/lib/types';
import { useAppDispatch } from '../store/hooks';
import { clearGamePick } from '../store/gamePicksSlice';
import { useUIState } from '@/app/store/useUI';
import { Button } from './Button';

interface WeekResetButtonProps {
  weekGames: GameLean[];
  onReset?: () => void;
  className?: string;
}

const WeekResetButton = ({ weekGames, onReset, className }: WeekResetButtonProps) => {
  const dispatch = useAppDispatch();
  const { mode } = useUIState();

  const handleClick = () => {
    const allCompleted = weekGames.every((game) => game.completed);
    const targets = allCompleted ? weekGames : weekGames.filter((game) => !game.completed);
    targets.forEach((game) => dispatch(clearGamePick(game.id)));
    if (onReset) {
      onReset();
    }
  };

  return (
    <Button.Stroked
      size="md"
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleClick}
      className={cn('text-xs', className)}
    >
      Reset Week
    </Button.Stroked>
  );
};

export default WeekResetButton;
