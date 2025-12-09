'use client';

import ChampionshipCard from './ChampionshipCard';
import { StandingEntry } from '@/app/store/api';

interface ChampionshipMatchupProps {
  team1: StandingEntry;
  team2: StandingEntry;
}

const ChampionshipMatchup = ({ team1, team2 }: ChampionshipMatchupProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold">Championship Matchup</div>
      <ChampionshipCard team1={team1} team2={team2} />
    </div>
  );
};

export default ChampionshipMatchup;

