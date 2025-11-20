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
    <div className="card card-sm relative bg-base-200 shadow-md">
      <div className="card-body flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <TimeDisplay date={game.date} timezone={game.venue.timezone} />
          {game.state === 'in' && <LiveBadge />}
        </div>

        {/* Scoreboard Layout: Logos with scores, team names below */}
        <div className="flex flex-col gap-2">
          {/* Top row: Logos and scores */}
          <div className="flex items-center justify-around">
            <Team team={game.away} showLogoOnly />
            <Score game={game} />
            <Team team={game.home} showLogoOnly />
          </div>
          {/* Bottom row: Team names */}
          <div className="flex items-center justify-around">
            <Team team={game.away} showNameOnly />
            <div className="text-base-content/40 text-base">@</div>
            <Team team={game.home} showNameOnly />
          </div>
        </div>

        <SpreadBadge game={game} />
        <VenueInfo venue={game.venue} />
      </div>
    </div>
  );
};

export default GameCard;
