'use client';

import Image from 'next/image';
import { StandingEntry } from '@/app/store/api';

interface StandingsExplanationsProps {
  standings: StandingEntry[];
}

const StandingsExplanations = ({ standings }: StandingsExplanationsProps) => {
  return (
    <div className="flex flex-col gap-3 text-xs">
      {standings.map((standing) => {
        return (
          <div key={standing.teamId} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">{standing.rank}.</span>
              {standing.logo && (
                <Image
                  src={standing.logo}
                  alt={standing.abbrev}
                  width={32}
                  height={32}
                  className="pointer-events-none h-8 w-auto object-contain"
                  unoptimized
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">
                  {standing.displayName} ({standing.confRecord.wins} - {standing.confRecord.losses})
                </span>
              </div>
            </div>
            <div className="text-base-content/80 ml-9">{standing.explainPosition}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StandingsExplanations;

