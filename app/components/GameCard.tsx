'use client';

import { GameLean } from '@/lib/types';
import { cn } from '@/lib/utils';
import Team from './Team';
import SpreadBadge from './SpreadBadge';
import LiveBadge from './LiveBadge';
import VenueInfo from './VenueInfo';
import TimeDisplay from './TimeDisplay';

interface GameCardProps {
  game: GameLean;
}

const GameCard = ({ game }: GameCardProps) => {
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
    <div className="card card-sm relative bg-gray-50 shadow-md dark:bg-gray-800">
      <div className="card-body flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <TimeDisplay date={game.date} timezone={game.venue.timezone} />
          {game.state === 'in' && <LiveBadge />}
        </div>

        {/* Scoreboard Layout: Home on left, Away on right */}
        <div className="flex items-center justify-between">
          <Team team={game.home} type="home" />

          {/* Scores - Centered and Prominent */}
          <div className="flex items-center gap-2">
            <div
              className={cn('text-4xl', {
                'font-bold': homeIsHigher || isTie,
                'font-normal': !(homeIsHigher || isTie),
              })}
            >
              {getScoreDisplay(game.home.score)}
            </div>
            <div className="text-base-content/40 text-xl">-</div>
            <div
              className={cn('text-4xl', {
                'font-bold': awayIsHigher || isTie,
                'font-normal': !(awayIsHigher || isTie),
              })}
            >
              {getScoreDisplay(game.away.score)}
            </div>
          </div>

          <Team team={game.away} type="away" />
        </div>

        <SpreadBadge game={game} />
        <VenueInfo venue={game.venue} />
      </div>
    </div>
  );
};

export default GameCard;
