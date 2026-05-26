'use client';

import { GameLean } from '@/lib/types';

interface VenueInfoProps {
  venue: GameLean['venue'];
}

const VenueInfo = ({ venue }: VenueInfoProps) => {
  return (
    <div className="flex w-full items-center gap-1">
      <div>{venue.fullName}</div>
      {venue.city && venue.state && (
        <>
          <div>•</div>
          <div>
            {venue.city}, {venue.state}
          </div>
        </>
      )}
    </div>
  );
};

export default VenueInfo;
