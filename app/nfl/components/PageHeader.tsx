import Image from 'next/image';
import { getTeamsInDivision, getTeamsInConference } from '@/lib/nfl/constants';
import { useAppSelector } from '@/app/store/hooks';
import type { FilterScope } from '../types';
import { nflTeamLogo } from '../utils';

const PageHeader = ({ scope }: { scope: FilterScope }) => {
  const year = useAppSelector((state) => state.app.season) ?? '';

  if (scope.level === 'team') {
    return (
      <div className="flex flex-col items-center gap-4">
        <Image
          src={nflTeamLogo(scope.team.abbrev)}
          alt={scope.team.displayName}
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1
            data-testid="nfl-heading"
            className="text-2xl font-bold text-base-content transition-colors"
          >
            {scope.team.displayName}
          </h1>
          <p className="text-base-content/70 text-sm">
            {scope.team.divisionId} &middot; {year} Playoff Simulator
          </p>
        </div>
      </div>
    );
  }
  if (scope.level === 'division') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col gap-2 text-center">
          <h1
            data-testid="nfl-heading"
            className="text-2xl font-bold text-base-content transition-colors"
          >
            {scope.divisionId}
          </h1>
          <p className="text-base-content/70 text-sm">
            {getTeamsInDivision(scope.divisionId).length} teams &middot; {year} Playoff Simulator
          </p>
        </div>
      </div>
    );
  }
  if (scope.level === 'conference') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col gap-2 text-center">
          <h1
            data-testid="nfl-heading"
            className="text-2xl font-bold text-base-content transition-colors"
          >
            {scope.conference}
          </h1>
          <p className="text-base-content/70 text-sm">
            {getTeamsInConference(scope.conference).length} teams &middot; {year} Playoff Simulator
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-2 text-center">
        <h1
          data-testid="nfl-heading"
          className="text-2xl font-bold text-base-content transition-colors"
        >
          NFL
        </h1>
        <p className="text-base-content/70 text-sm">{year} Playoff Simulator &middot; 32 teams</p>
      </div>
    </div>
  );
};

export default PageHeader;
