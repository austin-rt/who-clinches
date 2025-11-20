'use client';

import { GameLean } from '@/lib/types';
import Team from './Team';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useMemo, useEffect } from 'react';

interface CompactGameButtonProps {
  game: GameLean;
}

const CompactGameButton = ({ game }: CompactGameButtonProps) => {
  const dispatch = useAppDispatch();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  const calculateScoresForPick = (pickedTeamEspnId: string) => {
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
  };

  // Determine default selection: winner if completed, or favorite if available
  const defaultSelectedTeam = useMemo(() => {
    // If game is completed, use the actual winner
    if (game.completed) {
      const homeScore = game.home.score ?? 0;
      const awayScore = game.away.score ?? 0;
      if (homeScore > awayScore) {
        return game.home.teamEspnId;
      } else if (awayScore > homeScore) {
        return game.away.teamEspnId;
      }
    }
    // If not completed, default to favorite if available
    if (game.odds.favoriteTeamEspnId) {
      return game.odds.favoriteTeamEspnId;
    }
    // Fallback to home team (home field advantage)
    return game.home.teamEspnId;
  }, [
    game.completed,
    game.home.score,
    game.away.score,
    game.home.teamEspnId,
    game.away.teamEspnId,
    game.odds.favoriteTeamEspnId,
  ]);

  // Auto-select default team if no pick exists
  useEffect(() => {
    if (!gamePick && defaultSelectedTeam) {
      const scores = calculateScoresForPick(defaultSelectedTeam);
      dispatch(setGamePick({ gameId: game.espnId, pick: scores }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePick, defaultSelectedTeam, game.espnId, dispatch]);

  // Determine which team is currently selected (if any)
  const selectedTeam = useMemo(() => {
    if (!gamePick) {
      return defaultSelectedTeam;
    }

    // If home score > away score, home is selected
    if (gamePick.homeScore > gamePick.awayScore) {
      return game.home.teamEspnId;
    }
    // If away score > home score, away is selected
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

  // Determine win/loss status for each team
  const awayWon = isAwaySelected;
  const homeWon = isHomeSelected;

  return (
    <div className="flex h-[110px] w-[230px] items-center justify-center gap-2 rounded-lg border border-base-300 bg-base-200 p-2">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTeamClick(game.away.teamEspnId);
          }}
          className={`cursor-pointer rounded-lg p-1 transition-all ${
            isAwaySelected ? 'bg-primary/20' : ''
          } ${isAwaySelected ? 'opacity-100' : isSelected ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
        >
          <Team team={game.away} showLogoOnly />
        </button>
        {isSelected && (
          <span
            className={`text-base-content/70 text-xs ${awayWon ? 'font-extrabold' : 'font-semibold'}`}
          >
            {awayWon ? 'WIN' : 'LOSS'}
          </span>
        )}
      </div>
      <span className="text-base-content/60 text-sm">vs</span>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTeamClick(game.home.teamEspnId);
          }}
          className={`cursor-pointer rounded-lg p-1 transition-all ${
            isHomeSelected ? 'bg-primary/20' : ''
          } ${isHomeSelected ? 'opacity-100' : isSelected ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
        >
          <Team team={game.home} showLogoOnly />
        </button>
        {isSelected && (
          <span
            className={`text-base-content/70 text-xs ${homeWon ? 'font-extrabold' : 'font-semibold'}`}
          >
            {homeWon ? 'WIN' : 'LOSS'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactGameButton;
