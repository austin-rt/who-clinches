'use client';

import { GameLean } from '@/lib/types';
import CompactTeamSelector from './CompactTeamSelector';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useMemo, useEffect, useCallback } from 'react';

interface CompactGameButtonProps {
  game: GameLean;
}

const CompactGameButton = ({ game }: CompactGameButtonProps) => {
  const dispatch = useAppDispatch();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.id]);

  const calculateScoresForPick = useCallback(
    (pickedTeamId: string) => {
      const isPickingHome = pickedTeamId === game.home.teamId;

      if (game.completed) {
        const actualHomeScore = game.home.score ?? 0;
        const actualAwayScore = game.away.score ?? 0;

        if (isPickingHome) {
          return {
            homeScore: actualAwayScore >= actualHomeScore ? actualAwayScore + 1 : actualHomeScore,
            awayScore: actualAwayScore,
          };
        } else {
          return {
            homeScore: actualHomeScore,
            awayScore: actualHomeScore >= actualAwayScore ? actualHomeScore + 1 : actualAwayScore,
          };
        }
      }

      if (!game.predictedScore) {
        return { homeScore: 28, awayScore: 21 };
      }

      const baseHomeScore = game.predictedScore.home;
      const baseAwayScore = game.predictedScore.away;

      if (isPickingHome) {
        return {
          homeScore: baseAwayScore >= baseHomeScore ? baseAwayScore + 1 : baseHomeScore,
          awayScore: baseAwayScore,
        };
      } else {
        return {
          homeScore: baseHomeScore,
          awayScore: baseHomeScore >= baseAwayScore ? baseHomeScore + 1 : baseAwayScore,
        };
      }
    },
    [game.completed, game.home.teamId, game.home.score, game.away.score, game.predictedScore]
  );

  const defaultSelectedTeam = useMemo(() => {
    if (game.completed) {
      const homeScore = game.home.score ?? 0;
      const awayScore = game.away.score ?? 0;
      if (homeScore > awayScore) {
        return game.home.teamId;
      } else if (awayScore > homeScore) {
        return game.away.teamId;
      }
    }
    if (game.predictedScore) {
      if (game.predictedScore.home > game.predictedScore.away) {
        return game.home.teamId;
      } else if (game.predictedScore.away > game.predictedScore.home) {
        return game.away.teamId;
      }
    }
    if (game.odds.favoriteTeamId) {
      return game.odds.favoriteTeamId;
    }
    return game.home.teamId;
  }, [
    game.completed,
    game.home.score,
    game.away.score,
    game.home.teamId,
    game.away.teamId,
    game.predictedScore,
    game.odds.favoriteTeamId,
  ]);

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

export default CompactGameButton;
