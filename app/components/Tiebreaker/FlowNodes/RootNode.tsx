import { Handle, Position, type NodeProps } from '@xyflow/react';
import Image from 'next/image';
import type { TieFlowTeamMeta } from '@/app/store/api';

export type RootNodeData = {
  label: string;
  teamIds: string[];
  teams: Record<string, TieFlowTeamMeta>;
};

const RootNode = ({ data }: NodeProps) => {
  const { label, teamIds, teams } = data as unknown as RootNodeData;

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl px-3 py-2">
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
                <span className="text-xxs font-bold">{abbrev as string}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xs font-semibold">{label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-base-content/30"
      />
      <Handle type="source" position={Position.Right} id="right" className="!invisible" />
    </div>
  );
};

export default RootNode;
