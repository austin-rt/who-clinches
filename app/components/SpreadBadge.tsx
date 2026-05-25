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

  const isHomeFavorite = game.odds.favoriteTeamId === game.home.teamId;
  const isAwayFavorite = game.odds.favoriteTeamId === game.away.teamId;

  const getFavoredTeam = () => {
    if (isHomeFavorite) return game.home;
    if (isAwayFavorite) return game.away;
    return null;
  };
  const favoredTeam = getFavoredTeam();
  const favoredTeamColor = favoredTeam?.color;

  const style = useMemo(() => {
    if (!favoredTeamColor) return undefined;
    if (mode === 'light') {
      return {
        backgroundColor: `#${favoredTeamColor}33`,
        color: `#${favoredTeamColor}`,
      };
    }
    return {
      backgroundColor: `#${favoredTeamColor}`,
      color: `#ffffff`,
    };
  }, [mode, favoredTeamColor]);

  if (game.state !== 'pre' || game.odds.spread === null) {
    return null;
  }

  const getSpreadText = () => {
    if (isHomeFavorite) return `${game.home.abbrev} -${Math.abs(game.odds.spread!)}`;
    if (isAwayFavorite) return `${game.away.abbrev} -${Math.abs(game.odds.spread!)}`;
    return 'Even';
  };
  const spreadText = getSpreadText();

  return (
    <div
      className={cn('badge badge-soft badge-sm border-0 text-center text-xxs dark:bg-gray-500', {
        'self-end': isHomeFavorite,
        'self-start': isAwayFavorite,
      })}
      style={style}
    >
      {spreadText}
    </div>
  );
};

export default SpreadBadge;
