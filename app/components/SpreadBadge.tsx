'use client';

import { useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUIState } from '@/app/store/useUI';

interface SpreadBadgeProps {
  game: GameLean;
}

const SpreadBadge = ({ game }: SpreadBadgeProps) => {
  const { mode } = useUIState();

  const isHomeFavorite = game.odds.favoriteTeamEspnId === game.home.teamEspnId;
  const isAwayFavorite = game.odds.favoriteTeamEspnId === game.away.teamEspnId;
  const favoredTeam = isHomeFavorite ? game.home : isAwayFavorite ? game.away : null;
  const favoredTeamColor = favoredTeam?.color;

  const style = useMemo(() => {
    if (!favoredTeamColor) {
      return undefined;
    }

    if (mode === 'light') {
      // Light mode: use team colors
      return {
        backgroundColor: `#${favoredTeamColor}33`,
        color: `#${favoredTeamColor}`,
      };
    } else {
      // Dark mode: only set text color, background handled by className
      return {
        backgroundColor: `#${favoredTeamColor}`,
        color: `#ffffff`,
      };
    }
  }, [mode, favoredTeamColor]);

  if (game.state !== 'pre' || game.odds.spread === null) {
    return null;
  }

  const spreadText = isHomeFavorite
    ? `${game.home.abbrev} -${Math.abs(game.odds.spread)}`
    : isAwayFavorite
      ? `${game.away.abbrev} -${Math.abs(game.odds.spread)}`
      : 'Even';

  return (
    <div
      className={cn('badge badge-soft badge-sm border-0 text-center text-xs dark:bg-gray-500', {
        'self-end': isAwayFavorite,
        'self-start': isHomeFavorite,
      })}
      style={style}
    >
      {spreadText}
    </div>
  );
};

export default SpreadBadge;
