import { Handle, Position, type NodeProps } from '@xyflow/react';
import Image from 'next/image';
import type { TieFlowTeamMeta } from '@/app/store/api';

export type ResultNodeHData = {
  label: string;
  teamIds: string[];
  teams: Record<string, TieFlowTeamMeta>;
  detail: string;
  edgeLabel: string;
};

const ResultNodeH = ({ data }: NodeProps) => {
  const { label, teamIds, teams, detail } = data as unknown as ResultNodeHData;

  const singleTeam =
    teamIds.length === 1 ? (teams as Record<string, TieFlowTeamMeta>)[teamIds[0] as string] : null;
  const borderColor = singleTeam ? `#${singleTeam.color}` : undefined;

  return (
    <div
      className="flex flex-col items-center rounded-xl bg-base-200 px-3 py-2 shadow-sm"
      style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : undefined}
      title={detail as string}
    >
      <Handle type="target" position={Position.Top} id="top" className="!invisible" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-base-content/30" />
      <span className="text-xs font-bold tabular-nums leading-none">{label}</span>
      <div className="flex items-center gap-1">
        {teamIds.map((abbrev) => {
          const team = (teams as Record<string, TieFlowTeamMeta>)[abbrev as string];
          return (
            <div
              key={abbrev as string}
              className="flex h-14 w-14 items-center justify-center"
              title={team?.displayName || (abbrev as string)}
            >
              {team?.logo ? (
                <Image
                  src={team.logo}
                  alt={abbrev as string}
                  width={52}
                  height={52}
                  className="h-13 w-13 object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-bold">{abbrev as string}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultNodeH;
