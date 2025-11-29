'use client';

import { useState, useMemo } from 'react';
import { useGetSeasonGameDataQuery } from '@/app/store/apiSlice';
import { useParams } from 'next/navigation';

const parseRankFromStanding = (standing: string): number | null => {
  // Match patterns like "1st in SEC", "2nd in SEC", "3rd in SEC", "4th in SEC", etc.
  const match = standing.match(/^(\d+)(?:st|nd|rd|th)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // If it's "Tied for 1st" or similar, return 1
  if (standing.toLowerCase().includes('tied for 1st')) {
    return 1;
  }

  return null;
};

interface CurrentStandingsProps {
  season: number;
}

const CurrentStandings = ({ season }: CurrentStandingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const sport = params.sport as string;
  const conf = params.conf as string;

  const { data, isLoading } = useGetSeasonGameDataQuery(
    {
      sport,
      conf,
      season: season.toString(),
      force: true,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const sortedStandings = useMemo(() => {
    if (!data?.teams) return [];

    const teamsWithRank = data.teams
      .map((team) => ({
        team,
        rank: parseRankFromStanding(team.conferenceStanding),
      }))
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

    return teamsWithRank.map((item) => item.team);
  }, [data]);

  if (isLoading || !data) {
    return null;
  }

  if (sortedStandings.length === 0) {
    return null;
  }

  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-md">
      <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
      <div className="collapse-title w-full justify-center text-base font-semibold">
        Current Standings
      </div>
      <div className="collapse-content">
        <div className="columns-1 gap-x-4 gap-y-1 text-xs sm:columns-2 md:columns-4">
          {sortedStandings.map((team) => {
            const rank = parseRankFromStanding(team.conferenceStanding);
            const isTopTwo = rank === 1 || rank === 2;
            return (
              <div
                key={team.id}
                className={`flex items-center gap-1 whitespace-nowrap text-left ${isTopTwo ? 'font-semibold' : ''}`}
              >
                <span>{rank !== null ? `${rank}.` : team.conferenceStanding}</span>
                <span>{team.name}</span>
                <span className="text-base-content/70">({team.conferenceRecord})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrentStandings;
