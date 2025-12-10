'use client';

import Image from 'next/image';
import { StandingEntry } from '@/app/store/api';

interface ChampionshipCardProps {
  team1: StandingEntry;
  team2: StandingEntry;
}

const ChampionshipCard = ({ team1, team2 }: ChampionshipCardProps) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center justify-center gap-4 rounded-lg border-2 border-base-300 bg-base-200 p-4 dark:bg-base-300">
        <div className="flex flex-col items-center gap-2">
          {team1.logo && (
            <Image
              src={team1.logo}
              alt={team1.abbrev}
              width={64}
              height={64}
              className="pointer-events-none h-20 w-auto object-contain"
              unoptimized
            />
          )}
          <span className="text-center text-base font-semibold leading-none">{team1.abbrev}</span>
        </div>
        <span className="text-base-content/60 text-base leading-none">vs</span>
        <div className="flex flex-col items-center gap-1">
          {team2.logo && (
            <Image
              src={team2.logo}
              alt={team2.abbrev}
              width={64}
              height={64}
              className="pointer-events-none h-20 w-auto object-contain"
              unoptimized
            />
          )}
          <span className="text-center text-base font-semibold leading-none">{team2.abbrev}</span>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipCard;
