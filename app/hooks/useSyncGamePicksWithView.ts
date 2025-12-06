import { useEffect, useRef } from 'react';
import { GameLean } from '@/lib/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { ViewMode } from '@/types/frontend';

interface UseSyncGamePicksWithViewProps {
  games: GameLean[] | undefined;
  view: ViewMode;
}

export const useSyncGamePicksWithView = ({ games, view }: UseSyncGamePicksWithViewProps) => {
  const dispatch = useAppDispatch();
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const prevViewRef = useRef<ViewMode>(view);

  useEffect(() => {
    if (!games || prevViewRef.current === view) {
      prevViewRef.current = view;
      return;
    }

    prevViewRef.current = view;

    const isLiveTieGame = (game: GameLean): boolean => {
      return game.state === 'in' && !game.completed && (game.away.score ?? 0) === 0 && (game.home.score ?? 0) === 0;
    };

    const resetLiveGamePickToZero = (game: GameLean) => {
      const currentPick = gamePicks[game.id];
      if (currentPick && (currentPick.awayScore !== 0 || currentPick.homeScore !== 0)) {
        dispatch(
          setGamePick({
            gameId: game.id,
            pick: { awayScore: 0, homeScore: 0 },
          })
        );
      }
    };

    const setLiveGamePickToPredicted = (game: GameLean) => {
      if (!game.predictedScore) return;

      const currentPick = gamePicks[game.id];
      if (!currentPick || (currentPick.awayScore === 0 && currentPick.homeScore === 0)) {
        dispatch(
          setGamePick({
            gameId: game.id,
            pick: {
              awayScore: game.predictedScore.away,
              homeScore: game.predictedScore.home,
            },
          })
        );
      }
    };

    games.forEach((game) => {
      if (!isLiveTieGame(game)) return;

      if (view === 'scores') {
        resetLiveGamePickToZero(game);
      } else if (view === 'picks') {
        setLiveGamePickToPredicted(game);
      }
    });
  }, [view, games, gamePicks, dispatch]);
};

