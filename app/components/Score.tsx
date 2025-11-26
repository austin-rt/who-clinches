'use client';

import { useState, useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useUIState } from '../store/useUI';

interface ScoreProps {
  game: GameLean;
}

const Score = ({ game }: ScoreProps) => {
  const dispatch = useAppDispatch();
  const { view } = useUIState();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  const getCurrentScores = useMemo(() => {
    if (gamePick) {
      return { away: gamePick.awayScore, home: gamePick.homeScore };
    }
    if (game.completed) {
      return { away: game.away.score ?? 0, home: game.home.score ?? 0 };
    }
    if (game.predictedScore) {
      return { away: game.predictedScore.away, home: game.predictedScore.home };
    }
    return { away: 0, home: 0 };
  }, [gamePick, game.completed, game.away.score, game.home.score, game.predictedScore]);

  const [editingAway, setEditingAway] = useState<string | null>(null);
  const [editingHome, setEditingHome] = useState<string | null>(null);

  const awayScore = editingAway !== null ? editingAway : getCurrentScores.away.toString();
  const homeScore = editingHome !== null ? editingHome : getCurrentScores.home.toString();

  const handleScoreChange = (team: 'away' | 'home', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    if (team === 'away') {
      setEditingAway(value);
    } else {
      setEditingHome(value);
    }
  };

  const handleScoreBlur = () => {
    const away = editingAway !== null ? parseInt(editingAway, 10) || 0 : getCurrentScores.away;
    const home = editingHome !== null ? parseInt(editingHome, 10) || 0 : getCurrentScores.home;

    setEditingAway(null);
    setEditingHome(null);

    if (away === home || away < 0 || home < 0) {
      return;
    }

    dispatch(setGamePick({ gameId: game.espnId, pick: { homeScore: home, awayScore: away } }));
  };

  const getScoreDisplay = (score: number | null) => {
    return score !== null ? score.toString() : '—';
  };

  const awayScoreNum = parseInt(awayScore, 10) || 0;
  const homeScoreNum = parseInt(homeScore, 10) || 0;
  const awayIsHigher = awayScoreNum > homeScoreNum;
  const homeIsHigher = homeScoreNum > awayScoreNum;
  const isTie = awayScoreNum === homeScoreNum && awayScoreNum !== 0;

  const isEditable = view === 'scores' && !game.completed;

  if (isEditable) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={awayScore}
          onChange={(e) => handleScoreChange('away', e.target.value)}
          onBlur={handleScoreBlur}
          className={cn(
            'w-10 text-center text-2xl',
            'bg-transparent focus:border-primary focus:outline-none',
            {
              'font-extrabold': awayIsHigher && !isTie,
              'font-normal': !awayIsHigher || isTie,
            }
          )}
        />
        <div className="text-base-content/40 text-xl">-</div>
        <input
          type="text"
          inputMode="numeric"
          value={homeScore}
          onChange={(e) => handleScoreChange('home', e.target.value)}
          onBlur={handleScoreBlur}
          className={cn(
            'w-10 text-center text-2xl',
            'bg-transparent focus:border-primary focus:outline-none',
            {
              'font-extrabold': homeIsHigher && !isTie,
              'font-normal': !homeIsHigher || isTie,
            }
          )}
        />
      </div>
    );
  }

  const displayAway = gamePick ? gamePick.awayScore : game.away.score;
  const displayHome = gamePick ? gamePick.homeScore : game.home.score;
  const displayAwayIsHigher = (displayAway ?? -1) > (displayHome ?? -1);
  const displayHomeIsHigher = (displayHome ?? -1) > (displayAway ?? -1);
  const displayIsTie = displayAway === displayHome && displayAway !== null && displayAway !== 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('text-3xl md:text-4xl', {
          'font-extrabold': displayAwayIsHigher && !displayIsTie,
          'font-normal': !displayAwayIsHigher || displayIsTie,
        })}
      >
        {getScoreDisplay(displayAway)}
      </div>
      <div className="text-base-content/40 text-xl md:text-2xl">-</div>
      <div
        className={cn('text-3xl md:text-4xl', {
          'font-extrabold': displayHomeIsHigher && !displayIsTie,
          'font-normal': !displayHomeIsHigher || displayIsTie,
        })}
      >
        {getScoreDisplay(displayHome)}
      </div>
    </div>
  );
};

export default Score;
