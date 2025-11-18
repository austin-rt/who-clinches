'use client';

import Image from 'next/image';
import { GameLean } from '@/lib/types';

interface TeamProps {
  team: GameLean['home'] | GameLean['away'];
}

const Team = ({ team }: TeamProps) => {
  const getRankDisplay = (rank: number | null) => {
    return rank !== null && rank < 99 ? `#${rank}` : null;
  };

  const rank = getRankDisplay(team.rank);

  return (
    <div className="flex w-1/3 flex-col items-center gap-3">
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
        <span className="text-center text-lg font-semibold">{team.abbrev}</span>
      </div>
    </div>
  );
};

export default Team;
