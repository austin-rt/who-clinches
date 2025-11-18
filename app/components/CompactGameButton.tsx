'use client';

import { GameLean } from '@/lib/types';
import Team from './Team';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useUIState } from '../store/useUI';
import { useMemo, useEffect } from 'react';
import { xLog } from '@/lib/xLog';

interface CompactGameButtonProps {
  game: GameLean;
}

const CompactGameButton = ({ game }: CompactGameButtonProps) => {
  const dispatch = useAppDispatch();
  const { mode } = useUIState();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  // Calculate scores when a team is picked
  const calculateScoresForPick = (pickedTeamEspnId: string) => {
    // If game is completed, use actual scores
    if (game.completed) {
      return {
        homeScore: game.home.score ?? 0,
        awayScore: game.away.score ?? 0,
      };
    }

    if (!game.predictedScore) {
      // Fallback if no predicted score
      return { homeScore: 28, awayScore: 21 };
    }

    // If no favorite is set, treat home as default (home field advantage)
    const favoriteTeamEspnId = game.odds.favoriteTeamEspnId ?? game.home.teamEspnId;
    const isFavoriteHome = favoriteTeamEspnId === game.home.teamEspnId;
    const isPickedFavorite = pickedTeamEspnId === favoriteTeamEspnId;

    xLog('calculateScoresForPick', {
      pickedTeamEspnId,
      favoriteTeamEspnId,
      isFavoriteHome,
      isPickedFavorite,
      predictedScore: game.predictedScore,
      homeTeam: game.home.teamEspnId,
      awayTeam: game.away.teamEspnId,
    });

    if (isPickedFavorite) {
      // Picking the favored team: ensure favorite wins
      if (isFavoriteHome) {
        // Home is favorite - ensure home wins
        const homeScore = game.predictedScore.home;
        const awayScore = game.predictedScore.away;
        // If away is already winning or tied, make home win by 1
        const result =
          homeScore > awayScore
            ? { homeScore, awayScore }
            : { homeScore: awayScore + 1, awayScore };
        xLog('Picking favorite (home) - ensuring home wins', result);
        return result;
      } else {
        // Away is favorite - ensure away wins
        const homeScore = game.predictedScore.home;
        const awayScore = game.predictedScore.away;
        // If home is already winning or tied, make away win by 1
        const result =
          awayScore > homeScore
            ? { homeScore, awayScore }
            : { homeScore, awayScore: homeScore + 1 };
        xLog('Picking favorite (away) - ensuring away wins', result);
        return result;
      }
    } else {
      // Picking the underdog: keep favored's predictedScore, underdog = favored + 1
      if (isFavoriteHome) {
        // Home is favorite, away is underdog
        const result = {
          homeScore: game.predictedScore.home,
          awayScore: game.predictedScore.home + 1,
        };
        xLog('Picking underdog (away) - away wins by 1', result);
        return result;
      } else {
        // Away is favorite, home is underdog
        const result = {
          homeScore: game.predictedScore.away + 1,
          awayScore: game.predictedScore.away,
        };
        xLog('Picking underdog (home) - home wins by 1', result);
        return result;
      }
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
      xLog('No gamePick, using defaultSelectedTeam', {
        gameEspnId: game.espnId,
        defaultSelectedTeam,
      });
      return defaultSelectedTeam;
    }

    // If home score > away score, home is selected
    if (gamePick.homeScore > gamePick.awayScore) {
      xLog('Home selected based on scores', {
        gameEspnId: game.espnId,
        homeScore: gamePick.homeScore,
        awayScore: gamePick.awayScore,
        homeTeam: game.home.teamEspnId,
      });
      return game.home.teamEspnId;
    }
    // If away score > home score, away is selected
    if (gamePick.awayScore > gamePick.homeScore) {
      xLog('Away selected based on scores', {
        gameEspnId: game.espnId,
        homeScore: gamePick.homeScore,
        awayScore: gamePick.awayScore,
        awayTeam: game.away.teamEspnId,
      });
      return game.away.teamEspnId;
    }
    xLog('Scores are equal or invalid, using defaultSelectedTeam', {
      gameEspnId: game.espnId,
      homeScore: gamePick.homeScore,
      awayScore: gamePick.awayScore,
      defaultSelectedTeam,
    });
    return defaultSelectedTeam;
  }, [gamePick, game.home.teamEspnId, game.away.teamEspnId, defaultSelectedTeam, game.espnId]);

  const handleTeamClick = (teamEspnId: string) => {
    xLog('handleTeamClick called', {
      gameEspnId: game.espnId,
      clickedTeam: teamEspnId,
      selectedTeam,
      gamePick,
      gameCompleted: game.completed,
      homeTeam: game.home.teamEspnId,
      awayTeam: game.away.teamEspnId,
    });

    // Don't do anything if clicking the already selected team
    if (selectedTeam === teamEspnId) {
      xLog('Already selected, returning early');
      return;
    }

    const scores = calculateScoresForPick(teamEspnId);
    xLog('Dispatching setGamePick', { gameId: game.espnId, pick: scores });
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
          disabled={game.completed}
        >
          <Team team={game.away} showLogoOnly />
        </button>
        {isSelected && (
          <span
            className={`text-xs font-semibold ${
              awayWon
                ? mode === 'dark'
                  ? 'text-secondary'
                  : 'text-primary'
                : 'text-base-content/40'
            }`}
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
          disabled={game.completed}
        >
          <Team team={game.home} showLogoOnly />
        </button>
        {isSelected && (
          <span
            className={`text-xs font-semibold ${
              homeWon
                ? mode === 'dark'
                  ? 'text-secondary'
                  : 'text-primary'
                : 'text-base-content/40'
            }`}
          >
            {homeWon ? 'WIN' : 'LOSS'}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactGameButton;
