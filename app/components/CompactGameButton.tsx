'use client';

import { GameLean } from '@/lib/types';
import { getDefaultSelectedTeam, calculateDefaultScores } from '@/lib/utils/getDefaultPick';
import CompactTeamSelector from './CompactTeamSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { memo, useMemo, useEffect, useCallback } from 'react';

interface CompactGameButtonProps {
  game: GameLean;
}

const CompactGameButton = ({ game }: CompactGameButtonProps) => {
  const dispatch = useAppDispatch();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.id]);

  const calculateScoresForPick = useCallback(
    (pickedTeamId: string) => calculateDefaultScores(game, pickedTeamId),
    [game]
  );

  const defaultSelectedTeam = useMemo(() => getDefaultSelectedTeam(game), [game]);

  useEffect(() => {
    if (!gamePick && defaultSelectedTeam) {
      const scores = calculateScoresForPick(defaultSelectedTeam);
      dispatch(setGamePick({ gameId: game.id, pick: scores }));
    }
  }, [gamePick, defaultSelectedTeam, game.id, dispatch, calculateScoresForPick]);

  const selectedTeam = useMemo(() => {
    if (!gamePick) {
      return defaultSelectedTeam;
    }

    if (gamePick.homeScore > gamePick.awayScore) {
      return game.home.teamId;
    }
    if (gamePick.awayScore > gamePick.homeScore) {
      return game.away.teamId;
    }
    return defaultSelectedTeam;
  }, [gamePick, game.home.teamId, game.away.teamId, defaultSelectedTeam]);

  const handleTeamClick = (teamId: string) => {
    const scores = calculateScoresForPick(teamId);
    dispatch(setGamePick({ gameId: game.id, pick: scores }));
  };

  const isHomeSelected = selectedTeam === game.home.teamId;
  const isAwaySelected = selectedTeam === game.away.teamId;

  return (
    <div className="flex w-36 items-center justify-around rounded-lg border border-stroke-alt bg-base-200 px-1 py-1 sm:py-2 dark:bg-base-300">
      <CompactTeamSelector
        team={game.away}
        teamId={game.away.teamId}
        isSelected={isAwaySelected}
        isWon={isAwaySelected}
        onTeamClick={handleTeamClick}
      />
      <span className="text-base-content/60 text-xxs leading-none">vs</span>
      <CompactTeamSelector
        team={game.home}
        teamId={game.home.teamId}
        isSelected={isHomeSelected}
        isWon={isHomeSelected}
        onTeamClick={handleTeamClick}
      />
    </div>
  );
};

export default memo(CompactGameButton);
