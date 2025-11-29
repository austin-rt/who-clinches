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
    <div className="card card-sm relative bg-base-200 shadow-md dark:bg-base-300">
      <div className="card-body flex flex-col gap-4 px-2">
        <div className="flex items-center justify-between">
          <TimeDisplay date={game.date} timezone={game.venue.timezone} />
          {game.state === 'in' && <LiveBadge />}
        </div>

        <div className="flex items-center justify-evenly">
          <div className="flex flex-col items-center gap-1">
            <Team team={game.away} showLogoOnly />
            <span className="text-center text-xs font-semibold md:text-sm">{game.away.abbrev}</span>
          </div>
          <Score game={game} separate />
          <div className="flex flex-col items-center gap-1">
            <Team team={game.home} showLogoOnly />
            <span className="text-center text-xs font-semibold md:text-sm">{game.home.abbrev}</span>
          </div>
        </div>

        <SpreadBadge game={game} />
        <VenueInfo venue={game.venue} />
      </div>
    </div>
  );
};

export default GameCard;
