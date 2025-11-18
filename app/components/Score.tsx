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

  // Get the current scores to display/edit
  const getCurrentScores = useMemo(() => {
    if (gamePick) {
      return { away: gamePick.awayScore, home: gamePick.homeScore };
    }
    if (game.completed) {
      return { away: game.away.score ?? 0, home: game.home.score ?? 0 };
    }
    // Use predicted score for incomplete games
    if (game.predictedScore) {
      return { away: game.predictedScore.away, home: game.predictedScore.home };
    }
    return { away: 0, home: 0 };
  }, [gamePick, game.completed, game.away.score, game.home.score, game.predictedScore]);

  // Use local state only during editing, otherwise derive from source of truth
  const [editingAway, setEditingAway] = useState<string | null>(null);
  const [editingHome, setEditingHome] = useState<string | null>(null);

  // Get display values - use editing state if active, otherwise use source of truth
  const awayScore = editingAway !== null ? editingAway : getCurrentScores.away.toString();
  const homeScore = editingHome !== null ? editingHome : getCurrentScores.home.toString();

  const handleScoreChange = (team: 'away' | 'home', value: string) => {
    // Only allow digits
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
    // Get both scores - use editing state if available, otherwise use current scores
    const away = editingAway !== null ? parseInt(editingAway, 10) || 0 : getCurrentScores.away;
    const home = editingHome !== null ? parseInt(editingHome, 10) || 0 : getCurrentScores.home;

    // Clear editing state
    setEditingAway(null);
    setEditingHome(null);

    // Validate: no ties and non-negative
    if (away === home || away < 0 || home < 0) {
      return;
    }

    // Save to Redux
    dispatch(setGamePick({ gameId: game.espnId, pick: { homeScore: home, awayScore: away } }));
  };

  const getScoreDisplay = (score: number | null) => {
    return score !== null ? score.toString() : '—';
  };

  // Determine which score is higher for styling
  const awayScoreNum = parseInt(awayScore, 10) || 0;
  const homeScoreNum = parseInt(homeScore, 10) || 0;
  const awayIsHigher = awayScoreNum > homeScoreNum;
  const homeIsHigher = homeScoreNum > awayScoreNum;
  const isTie = awayScoreNum === homeScoreNum && awayScoreNum !== 0;

  // In scores mode and game not completed, show editable inputs
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
            'w-16 text-center text-3xl md:w-20 md:text-5xl',
            'border-b-2 border-transparent bg-transparent focus:border-primary focus:outline-none',
            {
              'font-extrabold': awayIsHigher && !isTie,
              'font-normal': !awayIsHigher || isTie,
            }
          )}
        />
        <div className="text-base-content/40 text-xl md:text-2xl">-</div>
        <input
          type="text"
          inputMode="numeric"
          value={homeScore}
          onChange={(e) => handleScoreChange('home', e.target.value)}
          onBlur={handleScoreBlur}
          className={cn(
            'w-16 text-center text-3xl md:w-20 md:text-5xl',
            'border-b-2 border-transparent bg-transparent focus:border-primary focus:outline-none',
            {
              'font-extrabold': homeIsHigher && !isTie,
              'font-normal': !homeIsHigher || isTie,
            }
          )}
        />
      </div>
    );
  }

  // Display mode: show scores as text
  const displayAway = gamePick ? gamePick.awayScore : game.away.score;
  const displayHome = gamePick ? gamePick.homeScore : game.home.score;
  const displayAwayIsHigher = (displayAway ?? -1) > (displayHome ?? -1);
  const displayHomeIsHigher = (displayHome ?? -1) > (displayAway ?? -1);
  const displayIsTie = displayAway === displayHome && displayAway !== null && displayAway !== 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('text-3xl md:text-5xl', {
          'font-extrabold': displayAwayIsHigher && !displayIsTie,
          'font-normal': !displayAwayIsHigher || displayIsTie,
        })}
      >
        {getScoreDisplay(displayAway)}
      </div>
      <div className="text-base-content/40 text-xl md:text-2xl">-</div>
      <div
        className={cn('text-3xl md:text-5xl', {
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
