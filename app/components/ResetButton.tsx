'use client';

import { cn } from '@/lib/utils';
import { GameLean } from '@/lib/types';
import { isPickAtDefault } from '@/lib/utils/getDefaultPick';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAllPicks } from '../store/gamePicksSlice';
import { Button } from './Button';

interface ResetButtonProps {
  games: GameLean[];
  hasSimulationResults?: boolean;
  onReset?: () => void;
  className?: string;
}

const ResetButton = ({ games, hasSimulationResults, onReset, className }: ResetButtonProps) => {
  const dispatch = useAppDispatch();
  const picks = useAppSelector((state) => state.gamePicks.picks);
  const hasOverrides = games.some((game) => !isPickAtDefault(game, picks[game.id]));
  const visible = hasOverrides || hasSimulationResults;

  const handleClick = () => {
    dispatch(clearAllPicks());
    if (onReset) {
      onReset();
    }
  };

  if (!visible) return null;

  return (
    <Button.Stroked
      data-testid="reset-button"
      size="md"
      color="primary"
      onClick={handleClick}
      className={cn('text-xs', className)}
    >
      Reset Season
    </Button.Stroked>
  );
};

export default ResetButton;
