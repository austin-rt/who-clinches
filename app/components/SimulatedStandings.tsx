'use client';

import { SimulateResponse } from '@/app/store/api';
import { useMemo } from 'react';
import ChampionshipMatchup from './ChampionshipMatchup';
import ShareButton from './ShareButton';
import StandingsExplanations from './StandingsExplanations';
import TiebreakerDetails from './TiebreakerDetails';
import type { GameLean } from '@/lib/types';

interface SimulatedStandingsProps {
  simulateResponse: SimulateResponse;
  games: GameLean[] | undefined;
}

const SimulatedStandings = ({ simulateResponse, games }: SimulatedStandingsProps) => {
  const championshipTeams = useMemo(() => {
    if (!simulateResponse?.championship) return null;
    const [team1Id, team2Id] = simulateResponse.championship;
    const team1 = simulateResponse.standings.find((s) => s.teamId === team1Id);
    const team2 = simulateResponse.standings.find((s) => s.teamId === team2Id);
    return team1 && team2 ? [team1, team2] : null;
  }, [simulateResponse]);

  return (
    <div className="flex flex-col gap-4">
      {championshipTeams && (
        <ChampionshipMatchup team1={championshipTeams[0]} team2={championshipTeams[1]} />
      )}
      <div className="flex justify-center">
        <ShareButton simulateResponse={simulateResponse} games={games} />
      </div>
      <div className="collapse collapse-arrow bg-base-300">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title min-h-0 py-2 text-sm font-semibold">Standings</div>
        <div className="collapse-content">
          <StandingsExplanations standings={simulateResponse.standings} />
        </div>
      </div>
      {simulateResponse.tieLogs && <TiebreakerDetails tieLogs={simulateResponse.tieLogs} />}
    </div>
  );
};

export default SimulatedStandings;
