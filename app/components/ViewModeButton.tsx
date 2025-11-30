'use client';

import { useEffect, useRef } from 'react';
import { BsTrophy } from 'react-icons/bs';
import { MdOutlineScoreboard } from 'react-icons/md';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setView } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';
import { useGamesData } from '@/app/hooks/useGamesData';
import { setGamePick } from '../store/gamePicksSlice';
import { Button } from './Button';

const ViewModeButton = () => {
  const dispatch = useAppDispatch();
  const { view, mode } = useUIState();
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as string;
  const currentSeason = new Date().getFullYear();
  const { enrichedGames } = useGamesData({ sport, conf, season: currentSeason });
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const prevViewRef = useRef(view);

  useEffect(() => {
    if (!enrichedGames) return;

    enrichedGames.forEach((game) => {
      if (game.state === 'in' && !game.completed) {
        const awayScore = game.away.score ?? 0;
        const homeScore = game.home.score ?? 0;
        const isZeroZero = awayScore === 0 && homeScore === 0;

        if (!isZeroZero) return;

        const currentPick = gamePicks[game.espnId];

        if (view === 'scores') {
          if (currentPick && (currentPick.awayScore !== 0 || currentPick.homeScore !== 0)) {
            dispatch(
              setGamePick({
                gameId: game.espnId,
                pick: { awayScore: 0, homeScore: 0 },
              })
            );
          }
        } else if (view === 'picks' && game.predictedScore) {
          if (
            !currentPick ||
            (currentPick.awayScore === 0 && currentPick.homeScore === 0)
          ) {
            dispatch(
              setGamePick({
                gameId: game.espnId,
                pick: {
                  awayScore: game.predictedScore.away,
                  homeScore: game.predictedScore.home,
                },
              })
            );
          }
        }
      }
    });

    prevViewRef.current = view;
  }, [view, enrichedGames, gamePicks, dispatch]);

  const handleClick = () => {
    const newView = view === 'picks' ? 'scores' : 'picks';
    dispatch(setView(newView));
  };

  return (
    <Button.Stroked
      color={mode === 'dark' ? 'accent' : 'primary'}
      onClick={handleClick}
      className="group swap swap-rotate relative"
    >
      <div
        className={`flex items-center gap-2 transition-colors ${view === 'scores' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <BsTrophy className="h-5 w-5 fill-current" />
        <span className="text-xs font-semibold">Picks</span>
      </div>
      <div
        className={`flex items-center gap-2 transition-colors ${view === 'picks' ? 'opacity-100' : 'absolute opacity-0'}`}
      >
        <MdOutlineScoreboard className="h-6 w-6 fill-current" />
        <span className="text-xs font-semibold">Scores</span>
      </div>
    </Button.Stroked>
  );
};

export default ViewModeButton;
