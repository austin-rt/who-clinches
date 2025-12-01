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
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  const calculateScoresForPick = useCallback(
    (pickedTeamEspnId: string) => {
      const isPickingHome = pickedTeamEspnId === game.home.teamEspnId;

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
    [game.completed, game.home.teamEspnId, game.home.score, game.away.score, game.predictedScore]
  );

  const defaultSelectedTeam = useMemo(() => {
    if (game.completed) {
      const homeScore = game.home.score ?? 0;
      const awayScore = game.away.score ?? 0;
      if (homeScore > awayScore) {
        return game.home.teamEspnId;
      } else if (awayScore > homeScore) {
        return game.away.teamEspnId;
      }
    }
    if (game.predictedScore) {
      if (game.predictedScore.home > game.predictedScore.away) {
        return game.home.teamEspnId;
      } else if (game.predictedScore.away > game.predictedScore.home) {
        return game.away.teamEspnId;
      }
    }
    if (game.odds.favoriteTeamEspnId) {
      return game.odds.favoriteTeamEspnId;
    }
    return game.home.teamEspnId;
  }, [
    game.completed,
    game.home.score,
    game.away.score,
    game.home.teamEspnId,
    game.away.teamEspnId,
    game.predictedScore,
    game.odds.favoriteTeamEspnId,
  ]);

  useEffect(() => {
    if (!gamePick && defaultSelectedTeam) {
      const scores = calculateScoresForPick(defaultSelectedTeam);
      dispatch(setGamePick({ gameId: game.espnId, pick: scores }));
    }
  }, [gamePick, defaultSelectedTeam, game.espnId, dispatch, calculateScoresForPick]);

  const selectedTeam = useMemo(() => {
    if (!gamePick) {
      return defaultSelectedTeam;
    }

    if (gamePick.homeScore > gamePick.awayScore) {
      return game.home.teamEspnId;
    }
    if (gamePick.awayScore > gamePick.homeScore) {
      return game.away.teamEspnId;
    }
    return defaultSelectedTeam;
  }, [gamePick, game.home.teamEspnId, game.away.teamEspnId, defaultSelectedTeam]);

  const handleTeamClick = (teamEspnId: string) => {
    const scores = calculateScoresForPick(teamEspnId);
    dispatch(setGamePick({ gameId: game.espnId, pick: scores }));
  };

  const isHomeSelected = selectedTeam === game.home.teamEspnId;
  const isAwaySelected = selectedTeam === game.away.teamEspnId;

  return (
    <div className="flex w-40 items-center justify-center gap-3 rounded-lg border border-base-300 bg-base-200 p-2 dark:border-base-400 dark:bg-base-300">
      <CompactTeamSelector
        team={game.away}
        teamEspnId={game.away.teamEspnId}
        isSelected={isAwaySelected}
        isWon={isAwaySelected}
        onTeamClick={handleTeamClick}
      />
      <span className="text-base-content/60 text-xxs leading-none">vs</span>
      <CompactTeamSelector
        team={game.home}
        teamEspnId={game.home.teamEspnId}
        isSelected={isHomeSelected}
        isWon={isHomeSelected}
        onTeamClick={handleTeamClick}
      />
    </div>
  );
};

export default CompactGameButton;
