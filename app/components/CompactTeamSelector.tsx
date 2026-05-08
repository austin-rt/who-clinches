'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { GameLean } from '@/lib/types';
import Team from './Team';
import TeamRankAbbrev from './TeamRankAbbrev';

interface CompactTeamSelectorProps {
  team: GameLean['home'] | GameLean['away'];
  teamId: string;
  isSelected: boolean;
  isWon: boolean;
  onTeamClick: (teamId: string) => void;
}

const CompactTeamSelector = ({
  team,
  teamId,
  isSelected,
  isWon,
  onTeamClick,
}: CompactTeamSelectorProps) => {
  const handleClick = () => {
    onTeamClick(teamId);
  };

  const hasRank = team.rank !== null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Pick ${team.abbrev} to win`}
      aria-pressed={isSelected}
      className={cn('flex cursor-pointer flex-col items-center rounded-lg', {
        'opacity-100': isSelected,
        'opacity-50': !isSelected,
      })}
    >
      <Team team={team} />
      <div
        className={cn('flex flex-col items-center', {
          'pl-3': hasRank,
        })}
      >
        <TeamRankAbbrev team={team} isSelected={isSelected} />
        <span
          className={cn('text-base-content/70 w-full text-center text-xxs leading-none', {
            'font-extrabold': isWon,
            'font-normal': !isWon,
          })}
        >
          {isWon ? 'W' : 'L'}
        </span>
      </div>
    </button>
  );
};

export default memo(CompactTeamSelector);
