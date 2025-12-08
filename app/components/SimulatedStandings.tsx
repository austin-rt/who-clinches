'use client';

import { SimulateResponse } from '@/app/store/apiSlice';
import { useMemo } from 'react';
import ChampionshipMatchup from './ChampionshipMatchup';
import StandingsExplanations from './StandingsExplanations';
import TiebreakerDetails from './TiebreakerDetails';

interface SimulatedStandingsProps {
  simulateResponse: SimulateResponse;
}

const SimulatedStandings = ({ simulateResponse }: SimulatedStandingsProps) => {
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
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">Standings</div>
            <StandingsExplanations standings={simulateResponse.standings} />
          </div>
          {simulateResponse.tieLogs && <TiebreakerDetails tieLogs={simulateResponse.tieLogs} />}
    </div>
  );
};

export default SimulatedStandings;
