'use client';

import Image from 'next/image';
import { StandingEntry } from '@/app/store/api';
import { useMemo } from 'react';

interface StandingsExplanationsProps {
  standings: StandingEntry[];
}

const StandingsExplanations = ({ standings }: StandingsExplanationsProps) => {
  const groupedStandings = useMemo(() => {
    const hasDivisions = standings.some((s) => s.division);
    if (!hasDivisions) {
      return { null: standings };
    }

    const grouped: Record<string, StandingEntry[]> = {};
    for (const standing of standings) {
      const division = standing.division || 'null';
      if (!grouped[division]) {
        grouped[division] = [];
      }
      grouped[division].push(standing);
    }

    const sortedDivisions = Object.keys(grouped).sort((a, b) => {
      if (a === 'East') return -1;
      if (b === 'East') return 1;
      if (a === 'West') return -1;
      if (b === 'West') return 1;
      return a.localeCompare(b);
    });

    const result: Record<string, StandingEntry[]> = {};
    for (const div of sortedDivisions) {
      result[div] = grouped[div];
    }
    return result;
  }, [standings]);

  const hasDivisions = standings.some((s) => s.division);

  return (
    <div className="flex flex-col gap-3 text-xs">
      {Object.entries(groupedStandings).map(([division, divisionStandings]) => {
        const midpoint = Math.ceil(divisionStandings.length / 2);
        const leftCol = divisionStandings.slice(0, midpoint);
        const rightCol = divisionStandings.slice(midpoint);

        return (
          <div key={division}>
            {hasDivisions && division !== 'null' && (
              <div className="text-base-content/80 mb-2 mt-2 text-sm font-bold uppercase">
                {division}
              </div>
            )}
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                {leftCol.map((standing) => (
                  <StandingRow key={standing.teamId} standing={standing} />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {rightCol.map((standing) => (
                  <StandingRow key={standing.teamId} standing={standing} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StandingRow = ({ standing }: { standing: StandingEntry }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold">{standing.rank}.</span>
      {standing.logo && (
        <Image
          src={standing.logo}
          alt={standing.abbrev}
          width={24}
          height={24}
          className="pointer-events-none h-6 w-auto object-contain"
          unoptimized
        />
      )}
      <span className="font-medium">
        {standing.displayName} ({standing.confRecord.wins} - {standing.confRecord.losses})
      </span>
    </div>
    <div className="text-base-content/70 ml-9 text-xxs">{standing.explainPosition}</div>
  </div>
);

export default StandingsExplanations;
