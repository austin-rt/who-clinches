'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HiChevronDown } from 'react-icons/hi2';
import { NFL_DIVISIONS, type NflDivisionId } from '@/lib/nfl/constants';
import type { NflSimulateResponse } from '@/lib/nfl/types';
import type { FilterScope } from '../types';
import { nflTeamLogo } from '../utils';

const getDivisionIds = (scope: FilterScope): NflDivisionId[] => {
  if (scope.level === 'division') return [scope.divisionId];
  if (scope.level === 'conference')
    return NFL_DIVISIONS.filter((d) => d.startsWith(scope.conference));
  return [...NFL_DIVISIONS];
};

const NflDivStandings = ({
  result,
  scope,
}: {
  result: NflSimulateResponse;
  scope: FilterScope;
}) => {
  const divIds = getDivisionIds(scope);

  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-stroke bg-base-200 shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-lg font-semibold text-base-content">Division Standings</span>
        <HiChevronDown
          className={`text-base-content/50 h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {divIds.map((divId) => {
            const standings = result.divisionStandings[divId];
            if (!standings) return null;
            return (
              <div
                key={divId}
                className="rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] p-3 dark:border-white/10 dark:from-white/20 dark:to-white/15"
              >
                <h4 className="text-base-content/50 mb-2 text-xs font-semibold uppercase tracking-wide">
                  {divId}
                </h4>
                {standings.map((entry, i) => (
                  <div key={entry.teamId} className="flex items-center gap-2 py-1">
                    <span className="text-base-content/40 w-4 text-center text-[10px]">
                      {i + 1}
                    </span>
                    <Image
                      src={entry.logo || nflTeamLogo(entry.abbrev)}
                      alt={entry.abbrev}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                      unoptimized
                    />
                    <span className="text-base-content/80 flex-1 text-xs font-medium">
                      {entry.abbrev}
                    </span>
                    <span className="text-base-content/50 text-[10px]">
                      {entry.record.wins}-{entry.record.losses}
                      {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NflDivStandings;
