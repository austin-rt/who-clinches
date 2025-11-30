'use client';

import { TieLog } from '@/lib/api-types';

interface TiebreakerDetailsProps {
  tieLogs: TieLog[];
}

const TiebreakerDetails = ({ tieLogs }: TiebreakerDetailsProps) => {
  if (!tieLogs || tieLogs.length === 0) {
    return null;
  }

  return (
    <div className="collapse collapse-arrow bg-base-300">
      <input type="checkbox" />
      <div className="collapse-title min-h-0 py-2 text-sm font-semibold">Tiebreaker Details</div>
      <div className="collapse-content">
        <div className="flex flex-col gap-3 pt-2 text-xs">
          {tieLogs.map((tieLog, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="font-medium">
                Tie {index + 1} - Teams: {tieLog.teams.join(', ')}
              </div>
              {tieLog.steps.map((step, stepIndex) => (
                <div key={stepIndex} className="text-base-content/80 ml-4">
                  <div>
                    {step.rule}: {step.detail}
                  </div>
                  <div className="text-base-content/70">
                    {step.label}: {step.survivors.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TiebreakerDetails;
