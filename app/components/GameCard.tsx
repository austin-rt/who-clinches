'use client';

import { GameLean } from '@/lib/types';
import Team from './Team';
import TeamRankAbbrev from './TeamRankAbbrev';
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
    <div className="boarder-base:300 card card-sm relative border-2 bg-base-200 shadow-md dark:border-base-400 dark:bg-base-300">
      <div className="card-body flex flex-col gap-2 px-2">
        <div className="flex items-center justify-between">
          <TimeDisplay date={game.date} timezone={game.venue.timezone} />
          {game.state === 'in' && <LiveBadge />}
        </div>

        <div className="flex items-center justify-evenly">
          <div className="flex flex-col items-center gap-1">
            <Team team={game.away} showLogoOnly />
            <TeamRankAbbrev team={game.away} />
          </div>
          <Score game={game} />
          <div className="flex flex-col items-center gap-1">
            <Team team={game.home} showLogoOnly />
            <TeamRankAbbrev team={game.home} />
          </div>
        </div>

        <SpreadBadge game={game} />
        <VenueInfo venue={game.venue} />
      </div>
    </div>
  );
};

export default GameCard;
