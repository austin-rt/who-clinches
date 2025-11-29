'use client';

import { useState, useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useUIState } from '../store/useUI';

interface ScoreProps {
  game: GameLean;
  separate?: boolean;
}

const Score = ({ game, separate = false }: ScoreProps) => {
  const dispatch = useAppDispatch();
  const { view } = useUIState();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  const getCurrentScores = useMemo(() => {
    if (game.completed) {
      return { away: game.away.score ?? 0, home: game.home.score ?? 0 };
    }
    if (gamePick && game.predictedScore) {
      const pickMatchesPredicted =
        gamePick.awayScore === game.predictedScore.away &&
        gamePick.homeScore === game.predictedScore.home;
      if (!pickMatchesPredicted) {
        return { away: gamePick.awayScore, home: gamePick.homeScore };
      }
    }
    if (game.predictedScore) {
      return { away: game.predictedScore.away, home: game.predictedScore.home };
    }
    if (gamePick) {
      return { away: gamePick.awayScore, home: gamePick.homeScore };
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
    const awayInput = (
      <input
        type="text"
        inputMode="numeric"
        value={awayScore}
        onChange={(e) => handleScoreChange('away', e.target.value)}
        onBlur={handleScoreBlur}
        className={cn(
          'h-8 w-10 flex-shrink-0 text-center text-3xl leading-none',
          'bg-transparent focus:border-primary focus:outline-none',
          {
            'font-extrabold': awayIsHigher && !isTie,
            'font-normal': !awayIsHigher || isTie,
          }
        )}
      />
    );

    const editableDash = (
      <div className="text-base-content/40 shrink-0 text-sm leading-none">-</div>
    );

    const homeInput = (
      <input
        type="text"
        inputMode="numeric"
        value={homeScore}
        onChange={(e) => handleScoreChange('home', e.target.value)}
        onBlur={handleScoreBlur}
        className={cn(
          'h-8 w-10 flex-shrink-0 text-center text-3xl leading-none',
          'bg-transparent focus:border-primary focus:outline-none',
          {
            'font-extrabold': homeIsHigher && !isTie,
            'font-normal': !homeIsHigher || isTie,
          }
        )}
      />
    );

    if (separate) {
      return [
        <div key="away-score" className="flex h-10 items-center">
          {awayInput}
        </div>,
        <div key="dash" className="flex h-10 items-center">
          {editableDash}
        </div>,
        <div key="home-score" className="flex h-10 items-center">
          {homeInput}
        </div>,
      ];
    }

    return (
      <div className="flex h-10 items-center gap-1">
        {awayInput}
        {editableDash}
        {homeInput}
      </div>
    );
  }

  const displayAway = gamePick
    ? gamePick.awayScore
    : game.completed
      ? game.away.score
      : (game.predictedScore?.away ?? game.away.score);
  const displayHome = gamePick
    ? gamePick.homeScore
    : game.completed
      ? game.home.score
      : (game.predictedScore?.home ?? game.home.score);
  const displayAwayIsHigher = (displayAway ?? -1) > (displayHome ?? -1);
  const displayHomeIsHigher = (displayHome ?? -1) > (displayAway ?? -1);
  const displayIsTie = displayAway === displayHome && displayAway !== null && displayAway !== 0;

  const awayScoreElement = (
    <div
      className={cn('h-10 min-w-[2.5rem] whitespace-nowrap text-4xl leading-none', {
        'font-extrabold': displayAwayIsHigher && !displayIsTie,
        'font-normal': !displayAwayIsHigher || displayIsTie,
      })}
    >
      {getScoreDisplay(displayAway)}
    </div>
  );

  const dashElement = <div className="text-base-content/40 shrink-0 text-sm leading-none">-</div>;

  const homeScoreElement = (
    <div
      className={cn('h-10 min-w-[2.5rem] whitespace-nowrap text-4xl leading-none', {
        'font-extrabold': displayHomeIsHigher && !displayIsTie,
        'font-normal': !displayHomeIsHigher || displayIsTie,
      })}
    >
      {getScoreDisplay(displayHome)}
    </div>
  );

  if (separate) {
    return [awayScoreElement, dashElement, homeScoreElement];
  }

  return (
    <div className="flex h-10 items-center gap-1">
      {awayScoreElement}
      {dashElement}
      {homeScoreElement}
    </div>
  );
};

export default Score;
