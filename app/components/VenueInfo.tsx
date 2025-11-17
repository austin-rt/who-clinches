'use client';

import { GameLean } from '@/lib/types';

interface VenueInfoProps {
  venue: GameLean['venue'];
}

const VenueInfo = ({ venue }: VenueInfoProps) => {
  return (
    <div className="text-base-content/60 text-base">
      {venue.fullName}
      {venue.city && venue.state && (
        <span className="text-base-content/50">
          {' '}
          • {venue.city}, {venue.state}
        </span>
      )}
    </div>
  );
};

export default VenueInfo;
