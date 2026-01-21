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
      {Object.entries(groupedStandings).map(([division, divisionStandings]) => (
        <div key={division}>
          {hasDivisions && division !== 'null' && (
            <div className="text-base-content/80 mb-2 mt-2 text-sm font-bold uppercase">
              {division}
            </div>
          )}
          {divisionStandings.map((standing) => {
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
                      {standing.displayName} ({standing.confRecord.wins} -{' '}
                      {standing.confRecord.losses})
                </span>
              </div>
            </div>
            <div className="text-base-content/80 ml-9">{standing.explainPosition}</div>
          </div>
        );
      })}
        </div>
      ))}
    </div>
  );
};

export default StandingsExplanations;
