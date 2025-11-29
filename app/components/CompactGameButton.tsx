'use client';

import { GameLean } from '@/lib/types';
import Team from './Team';
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
  const isSelected = isHomeSelected || isAwaySelected;

  const awayWon = isAwaySelected;
  const homeWon = isHomeSelected;

  return (
    <div className="flex h-20 w-40 items-center justify-center gap-1 rounded-lg border border-base-300 bg-base-200 p-1 dark:bg-base-100">
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTeamClick(game.away.teamEspnId);
          }}
          className={`cursor-pointer rounded-lg p-0.5 transition-all ${
            isAwaySelected ? 'bg-primary/20' : ''
          } ${isAwaySelected ? 'opacity-100' : isSelected ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
        >
          <Team team={game.away} showLogoOnly />
        </button>
        <span className="text-center text-[10px] font-semibold leading-none">
          {game.away.abbrev}
        </span>
        {isSelected && (
          <span
            className={`text-base-content/70 w-full text-center text-[10px] leading-none ${awayWon ? 'font-extrabold' : 'font-semibold'}`}
          >
            {awayWon ? 'W' : 'L'}
          </span>
        )}
      </div>
      <span className="text-base-content/60 text-[10px] leading-none">vs</span>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTeamClick(game.home.teamEspnId);
          }}
          className={`cursor-pointer rounded-lg p-0.5 transition-all ${
            isHomeSelected ? 'bg-primary/20' : ''
          } ${isHomeSelected ? 'opacity-100' : isSelected ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
        >
          <Team team={game.home} showLogoOnly />
        </button>
        <span className="text-center text-[10px] font-semibold leading-none">
          {game.home.abbrev}
        </span>
        {isSelected && (
          <span
            className={`text-base-content/70 w-full text-center text-[10px] leading-none ${homeWon ? 'font-extrabold' : 'font-semibold'}`}
          >
            {homeWon ? 'W' : 'L'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactGameButton;
