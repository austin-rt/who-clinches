'use client';

import { cn } from '@/lib/utils';
import { GameLean } from '@/lib/types';
import { isPickAtDefault } from '@/lib/utils/getDefaultPick';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearGamePick } from '../store/gamePicksSlice';
import { Button } from './Button';

interface WeekResetButtonProps {
  weekGames: GameLean[];
  onReset?: () => void;
  className?: string;
}

const WeekResetButton = ({ weekGames, onReset, className }: WeekResetButtonProps) => {
  const dispatch = useAppDispatch();
  const picks = useAppSelector((state) => state.gamePicks.picks);
  const hasOverrides = weekGames.some((game) => !isPickAtDefault(game, picks[game.id]));

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
      color="primary"
      onClick={handleClick}
      aria-hidden={!hasOverrides}
      tabIndex={hasOverrides ? 0 : -1}
      className={cn('text-xs', className, { invisible: !hasOverrides })}
    >
      Reset Week
    </Button.Stroked>
  );
};

export default WeekResetButton;
