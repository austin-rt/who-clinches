'use client';

import { cn } from '@/lib/utils';
import { GameLean } from '@/lib/types';

interface TeamRankAbbrevProps {
  team: GameLean['home'] | GameLean['away'];
  isSelected?: boolean;
}

const TeamRankAbbrev = ({ team, isSelected = false }: TeamRankAbbrevProps) => {
  return (
    <span className={cn('text-xxs text-center', isSelected ? 'font-semibold' : 'font-normal')}>
      {team.abbrev}
    </span>
  );
};

export default TeamRankAbbrev;
