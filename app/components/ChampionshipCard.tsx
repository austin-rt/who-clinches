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
      <div className="flex items-center justify-center gap-8 rounded-lg bg-base-300 px-10 py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-start">
            <span className="text-base-content/50 text-xs font-semibold leading-tight">#1</span>
            <div className="flex h-24 w-24 items-center justify-center">
              {team1.logo && (
                <Image
                  src={team1.logo}
                  alt={team1.abbrev}
                  width={64}
                  height={64}
                  className="pointer-events-none h-24 w-auto object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>
          <span className="text-center text-base font-semibold leading-none">{team1.abbrev}</span>
        </div>
        <span className="text-base-content/60 text-base leading-none">vs</span>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-start">
            <span className="text-base-content/50 text-xs font-semibold leading-tight">#2</span>
            <div className="flex h-24 w-24 items-center justify-center">
              {team2.logo && (
                <Image
                  src={team2.logo}
                  alt={team2.abbrev}
                  width={64}
                  height={64}
                  className="pointer-events-none h-24 w-auto object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>
          <span className="text-center text-base font-semibold leading-none">{team2.abbrev}</span>
        </div>
      </div>
    </div>
  );
};

export default ChampionshipCard;
