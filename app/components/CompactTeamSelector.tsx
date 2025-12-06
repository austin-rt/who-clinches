'use client';

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
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTeamClick(teamId);
  };

  const hasRank = team.rank !== null;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        className={cn('cursor-pointer rounded-lg transition-all', {
          'opacity-100': isSelected,
          'opacity-50': !isSelected,
        })}
      >
        <Team team={team} showLogoOnly />
      </button>
      <div
        className={cn('flex flex-col items-center', {
          'pl-3': hasRank,
        })}
      >
        <TeamRankAbbrev team={team} isSelected={isSelected} />
        <span
          className={cn('text-base-content/70 text-xxs w-full text-center leading-none', {
            'font-extrabold': isWon,
            'font-normal': !isWon,
          })}
        >
          {isWon ? 'W' : 'L'}
        </span>
      </div>
    </div>
  );
};

export default CompactTeamSelector;
