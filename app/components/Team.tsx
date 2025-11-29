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
      <div className="relative flex items-center">
        {rank && (
          <sup className="absolute -left-4 top-1 text-[8px] font-semibold leading-none">{rank}</sup>
        )}
        {team.logo && (
          <Image
            src={team.logo}
            alt={team.abbrev}
            width={40}
            height={40}
            className="pointer-events-none h-10 w-auto object-contain"
            unoptimized
          />
        )}
      </div>
    );
  }

  if (showNameOnly) {
    return (
      <div className="flex items-center justify-center">
        <span className="text-center text-xs font-semibold md:text-sm">{team.abbrev}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {team.logo && (
        <Image
          src={team.logo}
          alt={team.abbrev}
          width={64}
          height={64}
          className="h-20 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          unoptimized
        />
      )}
      <div className="flex items-center justify-center">
        <span className="text-center text-xs font-semibold md:text-sm">{team.abbrev}</span>
      </div>
    </div>
  );
};

export default Team;
