'use client';

import Image from 'next/image';
import { GameLean } from '@/lib/types';

interface TeamProps {
  team: GameLean['home'] | GameLean['away'];
  showLogoOnly?: boolean;
  showNameOnly?: boolean;
}

const Team = ({ team, showLogoOnly = false, showNameOnly = false }: TeamProps) => {
  const getRankDisplay = (rank: number | null) => {
    return rank !== null && rank < 99 ? `#${rank}` : null;
  };

  const rank = getRankDisplay(team.rank);

  if (showLogoOnly) {
    return (
      <div className="flex items-center">
        {team.logo && (
          <Image
            src={team.logo}
            alt={team.abbrev}
            width={64}
            height={64}
            className="h-16 w-auto object-contain"
            unoptimized
          />
        )}
      </div>
    );
  }

  if (showNameOnly) {
    return (
      <div className="relative flex items-center">
        {rank && <sup className="text-xxs absolute -left-5 top-2 font-semibold">{rank}</sup>}
        <span className="text-center text-base font-semibold md:text-lg">{team.abbrev}</span>
      </div>
    );
  }

  // Default: show both (for backwards compatibility if needed)
  return (
    <div className="flex flex-col items-center gap-1">
      {team.logo && (
        <Image
          src={team.logo}
          alt={team.abbrev}
          width={64}
          height={64}
          className="h-16 w-auto object-contain"
          unoptimized
        />
      )}
      <div className="flex items-center gap-1">
        {rank && <sup className="text-xxs font-semibold">{rank}</sup>}
        <span className="text-center text-base font-semibold md:text-lg">{team.abbrev}</span>
      </div>
    </div>
  );
};

export default Team;
