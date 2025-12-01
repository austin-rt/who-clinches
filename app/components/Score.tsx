'use client';

import { useState, useMemo } from 'react';
import { GameLean } from '@/lib/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setGamePick } from '../store/gamePicksSlice';
import { useUIState } from '../store/useUI';
import ScoreInput from './ScoreInput';

interface ScoreProps {
  game: GameLean;
}

const Score = ({ game }: ScoreProps) => {
  const dispatch = useAppDispatch();
  const { view } = useUIState();
  const gamePick = useAppSelector((state) => state.gamePicks.picks[game.espnId]);

  const getCurrentScores = useMemo(() => {
    if (game.completed) {
      return { away: game.away.score ?? 0, home: game.home.score ?? 0 };
    }
    if (view === 'scores' && game.state === 'in') {
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
  }, [
    gamePick,
    game.completed,
    game.state,
    game.away.score,
    game.home.score,
    game.predictedScore,
    view,
  ]);

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

  const awayScoreNum = parseInt(awayScore, 10) || 0;
  const homeScoreNum = parseInt(homeScore, 10) || 0;
  const awayIsHigher = awayScoreNum > homeScoreNum;
  const homeIsHigher = homeScoreNum > awayScoreNum;
  const isTie = awayScoreNum === homeScoreNum && awayScoreNum !== 0;

  const dash = <div className="text-base-content/40 shrink-0 text-sm leading-none">-</div>;

  return [
    <div key="away-score" className="flex h-10 items-center">
      <ScoreInput
        value={awayScore}
        onChange={(value) => handleScoreChange('away', value)}
        onBlur={handleScoreBlur}
        isHigher={awayIsHigher}
        isTie={isTie}
      />
    </div>,
    <div key="dash" className="flex h-10 items-center">
      {dash}
    </div>,
    <div key="home-score" className="flex h-10 items-center">
      <ScoreInput
        value={homeScore}
        onChange={(value) => handleScoreChange('home', value)}
        onBlur={handleScoreBlur}
        isHigher={homeIsHigher}
        isTie={isTie}
      />
    </div>,
  ];
};

export default Score;
