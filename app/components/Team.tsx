'use client';

import Image from 'next/image';
import { GameLean } from '@/lib/types';
import { useUIState } from '@/app/store/useUI';

interface TeamProps {
  team: GameLean['home'] | GameLean['away'];
}

const Team = ({ team }: TeamProps) => {
  const { view } = useUIState();

  return (
    <div className="flex items-center justify-center">
      {team.rank !== null && (
        <span className="self-start text-xxxs font-semibold leading-none">#{team.rank}</span>
      )}
      {team.logo && (
        <Image
          src={team.logo}
          alt={team.abbrev}
          width={64}
          height={64}
          className={`pointer-events-none h-auto min-w-10 object-contain ${view === 'scores' ? 'w-1/2' : 'w-10'}`}
          unoptimized
        />
      )}
    </div>
  );
};

export default Team;
