'use client';

import { GameLean } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ScoreProps {
  game: GameLean;
}

const Score = ({ game }: ScoreProps) => {
  const getScoreDisplay = (score: number | null) => {
    return score !== null ? score.toString() : '—';
  };

  // Determine which score is higher for styling
  const awayScore = game.away.score ?? -1;
  const homeScore = game.home.score ?? -1;
  const awayIsHigher = awayScore > homeScore;
  const homeIsHigher = homeScore > awayScore;
  const isTie = awayScore === homeScore && awayScore !== -1 && awayScore !== 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn('text-3xl md:text-5xl', {
          'font-extrabold': awayIsHigher && !isTie,
          'font-normal': !awayIsHigher || isTie,
        })}
      >
        {getScoreDisplay(game.away.score)}
      </div>
      <div className="text-base-content/40 text-xl md:text-2xl">-</div>
      <div
        className={cn('text-3xl md:text-5xl', {
          'font-extrabold': homeIsHigher && !isTie,
          'font-normal': !homeIsHigher || isTie,
        })}
      >
        {getScoreDisplay(game.home.score)}
      </div>
    </div>
  );
};

export default Score;
