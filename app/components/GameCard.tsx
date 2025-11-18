'use client';

import { GameLean } from '@/lib/types';
import Team from './Team';
import Score from './Score';
import SpreadBadge from './SpreadBadge';
import LiveBadge from './LiveBadge';
import VenueInfo from './VenueInfo';
import TimeDisplay from './TimeDisplay';

interface GameCardProps {
  game: GameLean;
}

const GameCard = ({ game }: GameCardProps) => {
  return (
    <div className="card card-sm relative bg-gray-50 shadow-md dark:bg-base-100">
      <div className="card-body flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <TimeDisplay date={game.date} timezone={game.venue.timezone} />
          {game.state === 'in' && <LiveBadge />}
        </div>

        {/* Scoreboard Layout: Away on left, Home on right */}
        <div className="flex items-center justify-around">
          <Team team={game.away} />
          <Score game={game} />
          <Team team={game.home} />
        </div>

        <SpreadBadge game={game} />
        <VenueInfo venue={game.venue} />
      </div>
    </div>
  );
};

export default GameCard;
