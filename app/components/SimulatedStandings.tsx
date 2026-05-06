'use client';

import { SimulateResponse } from '@/app/store/api';
import StandingsExplanations from './StandingsExplanations';
import TiebreakerGraphVertical from './TiebreakerGraphVertical';
import TiebreakerGraphHorizontal from './TiebreakerGraphHorizontal';

interface SimulatedStandingsProps {
  simulateResponse: SimulateResponse;
}

const SimulatedStandings = ({ simulateResponse }: SimulatedStandingsProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="collapse collapse-arrow bg-base-300">
        <input type="checkbox" defaultChecked />
        <div className="collapse-title min-h-0 py-2 text-sm font-semibold">Standings</div>
        <div className="collapse-content">
          <StandingsExplanations standings={simulateResponse.standings} />
        </div>
      </div>
      {simulateResponse.tieLogs && (
        <>
          <div className="lg:hidden">
            <TiebreakerGraphVertical tieFlowGraphs={simulateResponse.tieFlowGraphs} />
          </div>
          <div className="hidden lg:block">
            <TiebreakerGraphHorizontal tieFlowGraphs={simulateResponse.tieFlowGraphs} />
          </div>
        </>
      )}
    </div>
  );
};

export default SimulatedStandings;
