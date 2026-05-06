import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  Position,
  type EdgeProps,
} from '@xyflow/react';
import type { TieFlowTeamMeta } from '@/app/store/api';

export type TeamEdgeData = {
  label: string;
  teamIds: string[];
  teams: Record<string, TieFlowTeamMeta>;
};

const TeamEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) => {
  const strokeColor = 'var(--color-base-content)';

  const isRightToRight = sourcePosition === Position.Right && targetPosition === Position.Right;

  const [edgePath] = isRightToRight
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 10,
        offset: 40,
      })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ stroke: strokeColor, strokeWidth: 2, opacity: 0.6 }}
    />
  );
};

export default TeamEdge;
