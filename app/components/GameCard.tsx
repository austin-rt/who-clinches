'use client';

import Image from 'next/image';
import { GameLean } from '@/lib/types';

interface GameCardProps {
  game: GameLean;
}

const GameCard = ({ game }: GameCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getScoreDisplay = (score: number | null) => {
    return score !== null ? score.toString() : '—';
  };

  const getRankDisplay = (rank: number | null) => {
    return rank !== null && rank < 99 ? `#${rank}` : null;
  };

  const homeRank = getRankDisplay(game.home.rank);
  const awayRank = getRankDisplay(game.away.rank);

  // Determine which score is higher for styling
  const awayScore = game.away.score ?? -1;
  const homeScore = game.home.score ?? -1;
  const awayIsHigher = awayScore > homeScore;
  const homeIsHigher = homeScore > awayScore;
  const isTie = awayScore === homeScore && awayScore !== -1 && awayScore !== 0;

  return (
    <div className="card-compact card bg-gray-50 shadow-md dark:bg-gray-800">
      <div className="card-body">
        <div className="text-base-content/60 mb-3 text-xs">{formatDate(game.date)}</div>

        {/* Scoreboard Layout: Teams on sides, scores in center */}
        <div className="flex items-center justify-between gap-3">
          {/* Away Team */}
          <div className="flex flex-1 flex-col items-center gap-1">
            {game.away.logo && (
              <Image
                src={game.away.logo}
                alt={game.away.abbrev}
                width={40}
                height={40}
                className="h-10 w-10"
                unoptimized
              />
            )}
            <div className="flex items-center gap-1">
              {awayRank && <sup className="text-xxs font-semibold">{awayRank}</sup>}
              <span className="text-center text-sm font-semibold">{game.away.abbrev}</span>
            </div>
          </div>

          {/* Scores - Centered and Prominent */}
          <div className="flex items-center gap-2">
            <div className={`text-2xl ${awayIsHigher || isTie ? 'font-bold' : 'font-normal'}`}>
              {getScoreDisplay(game.away.score)}
            </div>
            <div className="text-base-content/40 text-lg">-</div>
            <div className={`text-2xl ${homeIsHigher || isTie ? 'font-bold' : 'font-normal'}`}>
              {getScoreDisplay(game.home.score)}
            </div>
          </div>

          {/* Home Team */}
          <div className="flex flex-1 flex-col items-center gap-1">
            {game.home.logo && (
              <Image
                src={game.home.logo}
                alt={game.home.abbrev}
                width={40}
                height={40}
                className="h-10 w-10"
                unoptimized
              />
            )}
            <div className="flex items-center gap-1">
              {homeRank && <sup className="text-xxs font-semibold">{homeRank}</sup>}
              <span className="text-center text-sm font-semibold">{game.home.abbrev}</span>
            </div>
          </div>
        </div>

        {/* Game State Badge */}
        {game.state === 'in' && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
            <span className="font-bold text-red-500">LIVE</span>
          </div>
        )}
        {game.state === 'pre' && (
          <>
            {game.odds.spread !== null && (
              <div className="text-base-content/60 badge badge-primary mt-3 text-center text-xs">
                Spread:{' '}
                {game.odds.favoriteTeamEspnId === game.home.teamEspnId
                  ? `${game.home.abbrev} -${Math.abs(game.odds.spread)}`
                  : game.odds.favoriteTeamEspnId === game.away.teamEspnId
                    ? `${game.away.abbrev} -${Math.abs(game.odds.spread)}`
                    : `Even`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameCard;
